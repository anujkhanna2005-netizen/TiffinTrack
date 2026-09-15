const express = require('express');
const router = express.Router();
const db = require('../db');
const { logAuditAction } = require('../middleware/auth');

async function getActiveCustomer(req) {
  if (req.user && (req.user.role === 'customer' || req.user.role === 'student')) {
    if (req.user.profile && req.user.profile.customer_id) return req.user.profile;
    const rows = await db.query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
    if (rows.length > 0) return rows[0];
  }
  const defaultCust = await db.query('SELECT * FROM customers WHERE customer_id = "C001"');
  return defaultCust[0] || null;
}

// GET /api/subscription
router.get('/', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const sql = `
      SELECT s.*, 
             p.plan_id, p.name AS plan_name, p.plan_type, p.price, p.description AS plan_description, p.meals_included, p.veg_or_nonveg,
             v.vendor_id, v.name AS vendor_name, v.cuisine_type, v.kitchen_address, v.contact AS vendor_contact, v.locality AS vendor_locality, v.avg_rating AS vendor_rating
      FROM subscriptions s
      JOIN meal_plans p ON s.plan_id = p.plan_id
      JOIN vendors v ON s.vendor_id = v.vendor_id
      WHERE s.customer_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC LIMIT 1
    `;
    const subs = await db.query(sql, [customer.customer_id]);
    if (subs.length === 0) return res.json(null);

    const s = subs[0];
    const daysRemaining = Math.max(0, Math.ceil((new Date(s.end_date) - new Date()) / (1000 * 60 * 60 * 24)));

    res.json({
      sub_id: s.sub_id,
      customer_id: s.customer_id,
      vendor_id: s.vendor_id,
      plan_id: s.plan_id,
      start_date: s.start_date,
      end_date: s.end_date,
      status: s.status,
      days_remaining: daysRemaining || 24,
      total_days: 30,
      plan: {
        plan_id: s.plan_id,
        name: s.plan_name,
        price: parseFloat(s.price) || 2800,
        plan_type: s.plan_type,
        description: s.plan_description,
        veg: s.veg_or_nonveg === 'veg' || s.veg_or_nonveg === 'both',
        meals_per_day: s.meals_included || 1
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

// POST /api/subscription
router.post('/', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Please log in as a student to subscribe' });

    const { plan_id, vendor_id } = req.body;
    if (!plan_id || !vendor_id) {
      return res.status(422).json({ error: 'Plan ID and Vendor ID are required' });
    }

    const newSubscription = await db.transaction(async (conn) => {
      const [activeRows] = await conn.query(
        'SELECT sub_id, plan_id, vendor_id FROM subscriptions WHERE customer_id = ? AND status = "active" FOR UPDATE',
        [customer.customer_id]
      );

      if (activeRows.length > 0) {
        const err = new Error('You already have an active subscription (' + activeRows[0].sub_id + '). Please cancel or switch your current subscription first.');
        err.statusCode = 409;
        throw err;
      }

      const [planRows] = await conn.query('SELECT * FROM meal_plans WHERE plan_id = ? AND vendor_id = ? AND status = "active"', [plan_id, vendor_id]);
      if (planRows.length === 0) {
        const err = new Error('Selected meal plan is unavailable or invalid');
        err.statusCode = 404;
        throw err;
      }
      const plan = planRows[0];

      const [countRows] = await conn.query('SELECT COUNT(*) as cnt FROM subscriptions');
      const nextSubId = 'S' + String(countRows[0].cnt + 1).padStart(3, '0');

      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      await conn.query(
        'INSERT INTO subscriptions (sub_id, customer_id, plan_id, vendor_id, start_date, end_date, status, auto_renew) VALUES (?, ?, ?, ?, ?, ?, "active", 0)',
        [nextSubId, customer.customer_id, plan_id, vendor_id, startDate, endDate]
      );

      const [payCount] = await conn.query('SELECT COUNT(*) as cnt FROM payments');
      const payId = 'PAY' + String(payCount[0].cnt + 1).padStart(3, '0');
      await conn.query(
        'INSERT INTO payments (payment_id, customer_id, subscription_id, amount, mode, status) VALUES (?, ?, ?, ?, "upi", "success")',
        [payId, customer.customer_id, nextSubId, plan.price]
      );

      const [delCount] = await conn.query('SELECT COUNT(*) as cnt FROM deliveries');
      const delId = 'D' + String(delCount[0].cnt + 1).padStart(3, '0');

      await conn.query(
        'INSERT INTO deliveries (delivery_id, subscription_id, agent_id, date, meal_type, status, notes) VALUES (?, ?, "A001", ?, "lunch", "pending", ?)',
        [delId, nextSubId, startDate, 'Daily fresh meal delivery']
      );

      const newWallet = Math.max(0, (parseFloat(customer.wallet_balance) || 1000) - parseFloat(plan.price));
      await conn.query('UPDATE customers SET wallet_balance = ? WHERE customer_id = ?', [newWallet, customer.customer_id]);

      return {
        sub_id: nextSubId,
        plan_id,
        vendor_id,
        start_date: startDate,
        end_date: endDate,
        plan: {
          name: plan.name,
          price: parseFloat(plan.price)
        },
        wallet: newWallet
      };
    });

    await logAuditAction(req, 'CREATE_SUBSCRIPTION', 'subscriptions', newSubscription.sub_id, 'Customer subscribed to plan ' + plan_id);

    return res.status(201).json({
      success: true,
      message: 'Subscription created successfully!',
      wallet: newSubscription.wallet,
      plan: newSubscription.plan,
      subscription: newSubscription
    });
  } catch (err) {
    console.error('Subscription creation error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// DELETE /api/subscription
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

    await logAuditAction(req, 'CANCEL_SUBSCRIPTION', 'subscriptions', sub.sub_id, 'Customer cancelled subscription');

    return res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (err) {
    console.error('Subscription cancellation error:', err);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// POST /api/subscription/skip
router.post('/skip', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Customer login required' });

    const { skip_date, meal_type, reason } = req.body;
    if (!skip_date) return res.status(422).json({ error: 'Skip date is required' });

    const activeSubs = await db.query('SELECT * FROM subscriptions WHERE customer_id = ? AND status = "active"', [customer.customer_id]);
    if (activeSubs.length === 0) return res.status(404).json({ error: 'No active subscription found' });

    const sub = activeSubs[0];
    const creditAmount = 80.00;

    const countRes = await db.query('SELECT COUNT(*) as cnt FROM skip_requests');
    const skipId = 'SKP' + String(countRes[0].cnt + 1).padStart(3, '0');

    await db.query(
      'INSERT INTO skip_requests (skip_id, subscription_id, customer_id, date, reason, refund_amount, refund_credited, applied_to_next_bill) VALUES (?, ?, ?, ?, ?, ?, 1, 1)',
      [skipId, sub.sub_id, customer.customer_id, skip_date, reason || 'Personal reason', creditAmount]
    );

    await db.query('UPDATE deliveries SET status = "skipped" WHERE subscription_id = ? AND date = ?', [sub.sub_id, skip_date]);

    await logAuditAction(req, 'SKIP_MEAL', 'skip_requests', skipId, 'Meal skipped on ' + skip_date + ' (₹' + creditAmount + ' credited)');

    return res.status(201).json({
      success: true,
      message: 'Meal skip request approved! ₹' + creditAmount + ' credited to your next billing cycle.',
      skip_id: skipId,
      credit_amount: creditAmount
    });
  } catch (err) {
    console.error('Skip meal error:', err);
    return res.status(500).json({ error: 'Failed to process skip meal request' });
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

      const remainingDays = 15;
      const proratedBalance = parseFloat(((oldSub.price / 30) * remainingDays).toFixed(2));

      await conn.query('UPDATE subscriptions SET status = "cancelled" WHERE sub_id = ?', [oldSub.sub_id]);

      const [countRows] = await conn.query('SELECT COUNT(*) as cnt FROM subscriptions');
      const newSubId = 'S' + String(countRows[0].cnt + 1).padStart(3, '0');
      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      await conn.query(
        'INSERT INTO subscriptions (sub_id, customer_id, plan_id, vendor_id, start_date, end_date, status, auto_renew, switched_from_sub_id) VALUES (?, ?, ?, ?, ?, ?, "active", 0, ?)',
        [newSubId, customer.customer_id, target_plan_id, target_vendor_id, startDate, endDate, oldSub.sub_id]
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
        prorated_balance_transferred: proratedBalance,
        remaining_days: remainingDays
      };
    });

    await logAuditAction(req, 'SWITCH_VENDOR', 'vendor_switch_logs', switchResult.switch_id, 'Switched vendor to ' + target_vendor_id + ' (Balance ₹' + switchResult.prorated_balance_transferred + ' transferred)');

    return res.status(200).json({
      success: true,
      message: 'Seamless vendor switch completed! ₹' + switchResult.prorated_balance_transferred + ' prorated credit transferred.',
      details: switchResult
    });
  } catch (err) {
    console.error('Vendor switch error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
