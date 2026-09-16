const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, logAuditAction } = require('../middleware/auth');

async function getActiveCustomer(req) {
  if (req.user && (req.user.role === 'customer' || req.user.role === 'student')) {
    if (req.user.profile && req.user.profile.customer_id) return req.user.profile;
    const rows = await db.query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    if (rows.length > 0) return rows[0];
  }
  return null;
}

// GET /api/subscription (Fetches active or pending subscription for current student)
router.get('/', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const sql = `
      SELECT s.*, 
             p.plan_id, p.name AS plan_name, p.plan_type, p.price, p.description AS plan_description, p.meals_included, p.veg_or_nonveg,
             v.vendor_id, v.name AS vendor_name, v.cuisine_type, v.kitchen_address, v.contact AS vendor_contact, v.locality AS vendor_locality, v.avg_rating AS vendor_rating,
             pay.payment_id, pay.amount_due, pay.status AS payment_status, pay.mode AS payment_mode
      FROM subscriptions s
      JOIN meal_plans p ON s.plan_id = p.plan_id
      JOIN vendors v ON s.vendor_id = v.vendor_id
      LEFT JOIN payments pay ON s.sub_id = pay.subscription_id
      WHERE s.customer_id = ? AND s.status IN ('active', 'pending')
      ORDER BY FIELD(s.status, 'active', 'pending'), s.created_at DESC LIMIT 1
    `;
    const subs = await db.query(sql, [customer.customer_id]);
    if (subs.length === 0) return res.json(null);

    const s = subs[0];
    const daysRemaining = Math.max(0, Math.ceil((new Date(s.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
    const lockedPrice = s.locked_price !== null ? parseFloat(s.locked_price) : (parseFloat(s.price) || 2800);
    const lockedMeals = s.locked_meals_included !== null ? parseInt(s.locked_meals_included, 10) : (s.meals_included || 30);
    const amountDue = s.amount_due !== null && s.amount_due !== undefined ? parseFloat(s.amount_due) : lockedPrice;

    res.json({
      sub_id: s.sub_id,
      customer_id: s.customer_id,
      vendor_id: s.vendor_id,
      plan_id: s.plan_id,
      start_date: s.start_date,
      end_date: s.end_date,
      status: s.status,
      approved_by: s.approved_by,
      approved_at: s.approved_at,
      mode: s.mode || 'cash_on_delivery',
      locked_price: lockedPrice,
      locked_meals_included: lockedMeals,
      amount_due: amountDue,
      payment_status: s.payment_status || 'pending_cash',
      payment_id: s.payment_id,
      days_remaining: daysRemaining || 24,
      total_days: 30,
      plan: {
        plan_id: s.plan_id,
        name: s.plan_name,
        price: lockedPrice,
        plan_type: s.plan_type,
        description: s.plan_description,
        veg: s.veg_or_nonveg === 'veg' || s.veg_or_nonveg === 'both',
        meals_per_day: s.meals_included || 1,
        meals_included: lockedMeals
      },
      vendor: {
        vendor_id: s.vendor_id,
        name: s.vendor_name,
        locality: s.vendor_locality,
        city: 'Bhopal',
        cuisine: s.cuisine_type,
        kitchen_address: s.kitchen_address,
        phone: s.vendor_contact,
        rating: parseFloat(s.vendor_rating) || 4.5
      }
    });
  } catch (err) {
    console.error('Error fetching subscription:', err);
    res.status(500).json({ error: 'Failed to retrieve subscription: ' + err.message });
  }
});

// POST /api/subscription (Direct Request & COD workflow)
router.post('/', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Please log in as a student to request a subscription' });

    const { plan_id, vendor_id } = req.body;
    if (!plan_id || !vendor_id) {
      return res.status(422).json({ error: 'Plan ID and Vendor ID are required' });
    }

    const newSubscription = await db.transaction(async (conn) => {
      // Duplicate Request Guard: check status IN ('active', 'pending')
      const [existingRows] = await conn.query(
        'SELECT sub_id, status FROM subscriptions WHERE customer_id = ? AND status IN ("active", "pending") FOR UPDATE',
        [customer.customer_id]
      );

      if (existingRows.length > 0) {
        const existing = existingRows[0];
        const err = new Error(
          existing.status === 'pending'
            ? 'You already have a pending subscription request (' + existing.sub_id + '). Please wait for approval or cancel it first.'
            : 'You already have an active subscription (' + existing.sub_id + '). Please cancel or switch your current subscription first.'
        );
        err.statusCode = 409;
        throw err;
      }

      // Check vendor status & plan validity
      const [planRows] = await conn.query(
        'SELECT p.*, v.status AS vendor_status FROM meal_plans p JOIN vendors v ON p.vendor_id = v.vendor_id WHERE p.plan_id = ? AND p.vendor_id = ? AND p.status = "active"',
        [plan_id, vendor_id]
      );
      if (planRows.length === 0) {
        const err = new Error('Selected meal plan is unavailable or invalid');
        err.statusCode = 404;
        throw err;
      }
      const plan = planRows[0];
      if (plan.vendor_status !== 'active') {
        const err = new Error('Vendor is currently inactive or not accepting new orders');
        err.statusCode = 422;
        throw err;
      }

      const [countRows] = await conn.query('SELECT COUNT(*) as cnt FROM subscriptions');
      const nextSubId = 'S' + String(countRows[0].cnt + 1).padStart(3, '0');

      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const lockedPrice = parseFloat(plan.price);
      const lockedMeals = parseInt(plan.meals_included, 10) || 30;

      // 1. Insert subscription with status = 'pending', mode = 'cash_on_delivery', locked_price, locked_meals_included
      await conn.query(
        'INSERT INTO subscriptions (sub_id, customer_id, plan_id, vendor_id, start_date, end_date, status, auto_renew, mode, locked_price, locked_meals_included) VALUES (?, ?, ?, ?, ?, ?, "pending", 0, "cash_on_delivery", ?, ?)',
        [nextSubId, customer.customer_id, plan_id, vendor_id, startDate, endDate, lockedPrice, lockedMeals]
      );

      // 2. Insert Payment record with status = 'pending_cash', amount = lockedPrice, amount_due = lockedPrice, mode = 'cash_on_delivery'
      // Note: Mode 'wallet' is NEVER used for new records
      const [payCount] = await conn.query('SELECT COUNT(*) as cnt FROM payments');
      const payId = 'PAY' + String(payCount[0].cnt + 1).padStart(3, '0');
      await conn.query(
        'INSERT INTO payments (payment_id, customer_id, subscription_id, amount, amount_due, mode, status) VALUES (?, ?, ?, ?, ?, "cash_on_delivery", "pending_cash")',
        [payId, customer.customer_id, nextSubId, lockedPrice, lockedPrice]
      );

      return {
        sub_id: nextSubId,
        plan_id,
        vendor_id,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        mode: 'cash_on_delivery',
        locked_price: lockedPrice,
        locked_meals_included: lockedMeals,
        amount_due: lockedPrice,
        payment_id: payId,
        plan: {
          name: plan.name,
          price: lockedPrice
        }
      };
    });

    await logAuditAction(req, 'CUSTOMER_REQUEST_SUBSCRIPTION', 'subscriptions', newSubscription.sub_id, 'Customer requested COD subscription to plan ' + plan_id);

    return res.status(201).json({
      success: true,
      message: 'Subscription request submitted! Awaiting vendor/admin approval.',
      subscription: newSubscription,
      plan: newSubscription.plan
    });
  } catch (err) {
    console.error('Subscription creation error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// PATCH /api/subscription/:id/cancel-request (Student cancels their own pending request)
router.patch('/:id/cancel-request', requireAuth, async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Customer login required' });

    const { id } = req.params;

    const rows = await db.query(
      'SELECT sub_id, customer_id, status FROM subscriptions WHERE sub_id = ? AND customer_id = ?',
      [id, customer.customer_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Subscription request not found' });
    }

    const sub = rows[0];
    if (sub.status !== 'pending') {
      return res.status(409).json({ error: 'Only pending subscription requests can be cancelled. Current status is: ' + sub.status });
    }

    const result = await db.query(
      'UPDATE subscriptions SET status = "cancelled" WHERE sub_id = ? AND status = "pending"',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ error: 'This request has already been processed.' });
    }

    await logAuditAction(req, 'CUSTOMER_CANCELLED_SUBSCRIPTION_REQUEST', 'subscriptions', id, 'Customer cancelled pending subscription request');

    return res.json({ success: true, message: 'Subscription request cancelled successfully.' });
  } catch (err) {
    console.error('Cancel request error:', err);
    return res.status(500).json({ error: 'Failed to cancel subscription request: ' + err.message });
  }
});

// DELETE /api/subscription (Student cancels active subscription)
router.delete('/', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Authentication required' });

    const activeSubs = await db.query('SELECT * FROM subscriptions WHERE customer_id = ? AND status = "active"', [customer.customer_id]);
    if (activeSubs.length === 0) {
      return res.status(404).json({ error: 'No active subscription found to cancel' });
    }

    const sub = activeSubs[0];
    await db.query('UPDATE subscriptions SET status = "cancelled" WHERE sub_id = ?', [sub.sub_id]);

    await logAuditAction(req, 'CANCEL_SUBSCRIPTION', 'subscriptions', sub.sub_id, 'Customer cancelled active subscription');

    return res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (err) {
    console.error('Subscription cancellation error:', err);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// POST /api/subscription/skip (Dynamic per-meal cost deduction from amount_due)
router.post('/skip', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Customer login required' });

    const { skip_date, meal_type, reason } = req.body;
    if (!skip_date) return res.status(422).json({ error: 'Skip date is required' });

    // 24hr advance notice verification
    const todayStr = new Date().toISOString().slice(0, 10);
    if (skip_date <= todayStr) {
      return res.status(422).json({ error: 'Meal skips require at least 24 hours advance notice.' });
    }

    const skipResult = await db.transaction(async (conn) => {
      // Find active subscription with locked pricing
      const [activeSubs] = await conn.query(
        `SELECT s.*, p.price AS plan_price, p.meals_included AS plan_meals, pay.payment_id, pay.amount_due, pay.status AS pay_status
         FROM subscriptions s
         JOIN meal_plans p ON s.plan_id = p.plan_id
         LEFT JOIN payments pay ON s.sub_id = pay.subscription_id
         WHERE s.customer_id = ? AND s.status = "active" FOR UPDATE`,
        [customer.customer_id]
      );

      if (activeSubs.length === 0) {
        const err = new Error('No active subscription found for meal skipping');
        err.statusCode = 404;
        throw err;
      }

      const sub = activeSubs[0];

      // Duplicate skip check for same date
      const [existingSkips] = await conn.query(
        'SELECT skip_id FROM skip_requests WHERE subscription_id = ? AND date = ?',
        [sub.sub_id, skip_date]
      );
      if (existingSkips.length > 0) {
        const err = new Error('A skip request has already been recorded for ' + skip_date);
        err.statusCode = 409;
        throw err;
      }

      // Compute dynamic per_meal_cost from locked pricing (Fix 1 & Fix 8)
      const lockedPrice = sub.locked_price !== null ? parseFloat(sub.locked_price) : parseFloat(sub.plan_price);
      const lockedMeals = sub.locked_meals_included !== null ? parseInt(sub.locked_meals_included, 10) : (parseInt(sub.plan_meals, 10) || 30);
      const perMealCost = parseFloat((lockedPrice / lockedMeals).toFixed(2));

      const [countRes] = await conn.query('SELECT COUNT(*) as cnt FROM skip_requests');
      const skipId = 'SKP' + String(countRes[0].cnt + 1).padStart(3, '0');

      await conn.query(
        'INSERT INTO skip_requests (skip_id, subscription_id, customer_id, date, reason, refund_amount, refund_credited, applied_to_next_bill) VALUES (?, ?, ?, ?, ?, ?, 1, 1)',
        [skipId, sub.sub_id, customer.customer_id, skip_date, reason || 'Personal reason', perMealCost]
      );

      await conn.query('UPDATE deliveries SET status = "skipped" WHERE subscription_id = ? AND date = ?', [sub.sub_id, skip_date]);

      // Atomically update payments.amount_due = GREATEST(0, amount_due - perMealCost)
      let currentAmountDue = sub.amount_due !== null && sub.amount_due !== undefined ? parseFloat(sub.amount_due) : lockedPrice;
      const newAmountDue = Math.max(0, parseFloat((currentAmountDue - perMealCost).toFixed(2)));

      if (sub.payment_id) {
        await conn.query(
          'UPDATE payments SET amount_due = ? WHERE payment_id = ?',
          [newAmountDue, sub.payment_id]
        );
      }

      return {
        skip_id: skipId,
        per_meal_cost: perMealCost,
        old_amount_due: currentAmountDue,
        new_amount_due: newAmountDue,
        skip_date
      };
    });

    await logAuditAction(req, 'SKIP_MEAL', 'skip_requests', skipResult.skip_id, `Meal skipped on ${skip_date} (Amount due adjusted by ₹${skipResult.per_meal_cost})`);

    return res.status(201).json({
      success: true,
      message: `Meal skip request approved! Amount due adjusted by ₹${skipResult.per_meal_cost.toFixed(2)}.`,
      skip_id: skipResult.skip_id,
      per_meal_cost: skipResult.per_meal_cost,
      credit_amount: skipResult.per_meal_cost,
      old_amount_due: skipResult.old_amount_due,
      new_amount_due: skipResult.new_amount_due,
      amount_due: skipResult.new_amount_due
    });
  } catch (err) {
    console.error('Skip meal error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to process skip meal request' });
  }
});

// GET /api/subscription/skips
router.get('/skips', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Authentication required' });

    const skips = await db.query('SELECT * FROM skip_requests WHERE customer_id = ? ORDER BY date DESC', [customer.customer_id]);
    return res.json(skips);
  } catch (err) {
    console.error('Fetch skips error:', err);
    return res.status(500).json({ error: 'Failed to fetch skip history' });
  }
});

// PUT /api/subscription/preferences
router.put('/preferences', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Authentication required' });

    const { spice_level, no_onion_garlic, dietary_pref } = req.body;
    const pref = dietary_pref || (no_onion_garlic ? 'jain' : (spice_level || 'veg'));

    await db.query('UPDATE customers SET dietary_pref = ? WHERE customer_id = ?', [pref, customer.customer_id]);

    await logAuditAction(req, 'UPDATE_PREFERENCES', 'customers', customer.customer_id, 'Updated dietary preference to ' + pref);

    return res.json({ success: true, message: 'Meal customization preferences saved successfully!' });
  } catch (err) {
    console.error('Preferences error:', err);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// POST /api/subscription/switch-vendor
router.post('/switch-vendor', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Customer authentication required' });

    const { target_vendor_id, target_plan_id, reason } = req.body;
    if (!target_vendor_id || !target_plan_id) {
      return res.status(422).json({ error: 'Target vendor ID and plan ID are required' });
    }

    const switchResult = await db.transaction(async (conn) => {
      const [currSubs] = await conn.query(
        'SELECT s.*, p.price FROM subscriptions s JOIN meal_plans p ON s.plan_id = p.plan_id WHERE s.customer_id = ? AND s.status = "active" FOR UPDATE',
        [customer.customer_id]
      );

      if (currSubs.length === 0) {
        const err = new Error('No active subscription found to switch from.');
        err.statusCode = 404;
        throw err;
      }

      const oldSub = currSubs[0];
      if (oldSub.vendor_id === target_vendor_id) {
        const err = new Error('You are already subscribed to this vendor.');
        err.statusCode = 400;
        throw err;
      }

      const [targetPlans] = await conn.query('SELECT * FROM meal_plans WHERE plan_id = ? AND vendor_id = ?', [target_plan_id, target_vendor_id]);
      if (targetPlans.length === 0) {
        const err = new Error('Target meal plan is invalid.');
        err.statusCode = 404;
        throw err;
      }
      const targetPlan = targetPlans[0];

      const oldPrice = oldSub.locked_price !== null ? parseFloat(oldSub.locked_price) : parseFloat(oldSub.price);
      const remainingDays = 15;
      const proratedCredit = parseFloat(((oldPrice / 30) * remainingDays).toFixed(2));
      const targetPrice = parseFloat(targetPlan.price);
      const newAmountDue = Math.max(0, parseFloat((targetPrice - proratedCredit).toFixed(2)));

      await conn.query('UPDATE subscriptions SET status = "cancelled" WHERE sub_id = ?', [oldSub.sub_id]);

      const [countRows] = await conn.query('SELECT COUNT(*) as cnt FROM subscriptions');
      const newSubId = 'S' + String(countRows[0].cnt + 1).padStart(3, '0');
      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      await conn.query(
        'INSERT INTO subscriptions (sub_id, customer_id, plan_id, vendor_id, start_date, end_date, status, auto_renew, mode, locked_price, locked_meals_included, switched_from_sub_id) VALUES (?, ?, ?, ?, ?, ?, "active", 0, "cash_on_delivery", ?, ?, ?)',
        [newSubId, customer.customer_id, target_plan_id, target_vendor_id, startDate, endDate, targetPrice, parseInt(targetPlan.meals_included, 10) || 30, oldSub.sub_id]
      );

      const [payCount] = await conn.query('SELECT COUNT(*) as cnt FROM payments');
      const payId = 'PAY' + String(payCount[0].cnt + 1).padStart(3, '0');
      await conn.query(
        'INSERT INTO payments (payment_id, customer_id, subscription_id, amount, amount_due, mode, status) VALUES (?, ?, ?, ?, ?, "cash_on_delivery", "pending_cash")',
        [payId, customer.customer_id, newSubId, targetPrice, newAmountDue]
      );

      const [switchCount] = await conn.query('SELECT COUNT(*) as cnt FROM vendor_switch_logs');
      const switchId = 'SW' + String(switchCount[0].cnt + 1).padStart(3, '0');

      await conn.query(
        'INSERT INTO vendor_switch_logs (switch_id, customer_id, old_vendor_id, new_vendor_id, old_sub_id, new_sub_id, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [switchId, customer.customer_id, oldSub.vendor_id, target_vendor_id, oldSub.sub_id, newSubId, reason || 'Switching for variety']
      );

      return {
        switch_id: switchId,
        old_sub_id: oldSub.sub_id,
        new_sub_id: newSubId,
        from_vendor_id: oldSub.vendor_id,
        to_vendor_id: target_vendor_id,
        prorated_balance_transferred: proratedCredit,
        remaining_days: remainingDays,
        new_amount_due: newAmountDue
      };
    });

    await logAuditAction(req, 'SWITCH_VENDOR', 'vendor_switch_logs', switchResult.switch_id, 'Switched vendor to ' + target_vendor_id + ' (Credit ₹' + switchResult.prorated_balance_transferred + ' applied)');

    return res.status(200).json({
      success: true,
      message: 'Seamless vendor switch completed! ₹' + switchResult.prorated_balance_transferred + ' credit applied. Amount due: ₹' + switchResult.new_amount_due,
      details: switchResult
    });
  } catch (err) {
    console.error('Vendor switch error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;

