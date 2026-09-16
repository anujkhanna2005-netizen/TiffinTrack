const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole, logAuditAction } = require('../middleware/auth');

async function getActiveVendor(req) {
  if (req.user && req.user.role === 'vendor') {
    if (req.user.profile && req.user.profile.vendor_id) return req.user.profile;
    const rows = await db.query('SELECT * FROM vendors WHERE user_id = ?', [req.user.user_id]);
    if (rows.length > 0) return rows[0];
  }
  const defaultVend = await db.query('SELECT * FROM vendors WHERE vendor_id = "V001"');
  return defaultVend[0] || null;
}

// GET /api/vendor (dashboard)
router.get('/', async (req, res) => {
  try {
    const vendor = await getActiveVendor(req);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

    const today = new Date().toISOString().slice(0, 10);

    const [
      subCount,
      pendingSubCount,
      delCount,
      compCount,
      reviewCount,
      menuRows,
      plans,
      rbRows,
      recent_ratings,
      complaints,
      subRows
    ] = await Promise.all([
      db.query('SELECT COUNT(DISTINCT sub_id) as cnt FROM subscriptions WHERE vendor_id = ? AND status = "active"', [vendor.vendor_id]),
      db.query('SELECT COUNT(DISTINCT sub_id) as cnt FROM subscriptions WHERE vendor_id = ? AND status = "pending"', [vendor.vendor_id]),
      db.query(`
        SELECT COUNT(*) as total, SUM(CASE WHEN d.status = "delivered" THEN 1 ELSE 0 END) as delivered 
        FROM deliveries d 
        JOIN subscriptions s ON d.subscription_id = s.sub_id 
        WHERE s.vendor_id = ? AND d.date = ?
      `, [vendor.vendor_id, today]),
      db.query('SELECT COUNT(*) as cnt FROM complaints WHERE vendor_id = ? AND (status = "open" OR status = "in_review")', [vendor.vendor_id]),
      db.query('SELECT COUNT(*) as cnt FROM ratings WHERE vendor_id = ?', [vendor.vendor_id]),
      db.query('SELECT * FROM daily_menus WHERE vendor_id = ? AND date = ?', [vendor.vendor_id, today]),
      db.query('SELECT plan_id, vendor_id, name AS plan_name, name, plan_type, price, meals_included, veg_or_nonveg, description FROM meal_plans WHERE vendor_id = ? AND status = "active"', [vendor.vendor_id]),
      db.query(`
        SELECT 
          AVG(taste_score) as taste,
          AVG(hygiene_score) as hygiene,
          AVG(punctuality_score) as punctuality,
          AVG(value_score) as value
        FROM ratings
        WHERE vendor_id = ?
      `, [vendor.vendor_id]),
      db.query(`
        SELECT r.rating_id, r.taste_score, r.hygiene_score, r.punctuality_score, r.value_score,
               r.weighted_score AS overall_score, r.review_text AS review, r.created_at,
               c.name AS customer_name, c.locality AS customer_locality
        FROM ratings r
        JOIN customers c ON r.customer_id = c.customer_id
        WHERE r.vendor_id = ?
        ORDER BY r.created_at DESC LIMIT 5
      `, [vendor.vendor_id]),
      db.query(`
        SELECT c.*, cust.name AS customer_name,
               CASE WHEN c.status = 'open' THEN 'pending' ELSE c.status END AS status
        FROM complaints c
        JOIN customers cust ON c.customer_id = cust.customer_id
        WHERE c.vendor_id = ?
        ORDER BY c.created_at DESC
      `, [vendor.vendor_id]),
      db.query(`
        SELECT s.sub_id, s.start_date, s.end_date, s.status, s.locked_price, s.locked_meals_included, s.approved_by, s.approved_at,
               c.customer_id, c.name AS customer_name, c.phone AS customer_phone, c.pg_or_flat_name, c.room_no, c.locality,
               p.plan_id, p.name AS plan_name, p.price,
               pay.payment_id, pay.amount_due, pay.status AS payment_status, pay.collected_at
        FROM subscriptions s
        JOIN customers c ON s.customer_id = c.customer_id
        JOIN meal_plans p ON s.plan_id = p.plan_id
        LEFT JOIN payments pay ON s.sub_id = pay.subscription_id
        WHERE s.vendor_id = ?
        ORDER BY FIELD(s.status, 'pending', 'active', 'cancelled', 'rejected'), s.created_at DESC
      `, [vendor.vendor_id])
    ]);

    const rb = rbRows[0] || {};
    const rating_breakdown = {
      taste: parseFloat(rb.taste) || 4.8,
      hygiene: parseFloat(rb.hygiene) || 4.7,
      punctuality: parseFloat(rb.punctuality) || 4.6,
      value: parseFloat(rb.value) || 4.5
    };

    const subscribers = subRows.map(s => {
      const lockedPrice = s.locked_price !== null ? parseFloat(s.locked_price) : (parseFloat(s.price) || 2800);
      const amountDue = s.amount_due !== null && s.amount_due !== undefined ? parseFloat(s.amount_due) : lockedPrice;
      return {
        sub_id: s.sub_id,
        start_date: s.start_date,
        end_date: s.end_date,
        status: s.status,
        approved_by: s.approved_by,
        approved_at: s.approved_at,
        customer: {
          customer_id: s.customer_id,
          name: s.customer_name,
          residence: s.pg_or_flat_name,
          room: s.room_no,
          phone: s.customer_phone
        },
        plan: {
          plan_id: s.plan_id,
          name: s.plan_name,
          price: lockedPrice
        },
        payment: {
          payment_id: s.payment_id,
          amount_due: amountDue,
          status: s.payment_status || 'pending_cash',
          collected_at: s.collected_at
        }
      };
    });

    return res.json({
      vendor: {
        ...vendor,
        city: 'Bhopal'
      },
      stats: {
        active_subscribers: subCount[0].cnt || 0,
        pending_requests: pendingSubCount[0].cnt || 0,
        today_deliveries: delCount[0].total || 0,
        delivered_count: delCount[0].delivered || 0,
        open_complaints: compCount[0].cnt || 0,
        overall_rating: parseFloat(vendor.avg_rating) || 4.5,
        rating_count: reviewCount[0].cnt || 0,
        avg_rating: parseFloat(vendor.avg_rating) || 4.5
      },
      rating_breakdown,
      recent_ratings,
      complaints,
      subscribers,
      today_menu: menuRows[0] || null,
      plans
    });
  } catch (err) {
    console.error('Vendor dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch vendor data: ' + err.message });
  }
});

function normalizeMenuItems(rawItems) {
  let parsed = rawItems;
  if (typeof rawItems === 'string') {
    try {
      parsed = JSON.parse(rawItems);
    } catch (e) {
      parsed = [];
    }
  }
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    return parsed.map((item, idx) => {
      if (typeof item === 'string') {
        return {
          item_id: String(idx + 1),
          name: item,
          category: 'Main',
          quantity: '1 serving'
        };
      }
      if (typeof item === 'object' && item !== null) {
        return {
          item_id: String(item.item_id || item.id || idx + 1),
          name: item.name || item.item_name || 'Special Item',
          category: item.category || 'Main',
          quantity: item.quantity || item.portion || '1 serving'
        };
      }
      return null;
    }).filter(Boolean);
  } else if (typeof parsed === 'object' && parsed !== null) {
    return Object.entries(parsed).map(([key, val], idx) => {
      const name = typeof val === 'string' ? val : (val && val.name ? val.name : String(val));
      const cat = key.charAt(0).toUpperCase() + key.slice(1);
      return {
        item_id: String(idx + 1),
        name: name,
        category: cat || 'Main',
        quantity: (val && val.quantity) ? val.quantity : '1 serving'
      };
    });
  }
  return [];
}

// GET /api/vendor/menu and /api/vendor/:id/menu
router.get(['/menu', '/:id/menu'], async (req, res) => {
  try {
    let vendorId = req.params.id;
    if (!vendorId || vendorId === 'menu') {
      const vendor = await getActiveVendor(req);
      if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
      vendorId = vendor.vendor_id;
    }
    const today = new Date().toISOString().slice(0, 10);
    const rows = await db.query('SELECT * FROM daily_menus WHERE vendor_id = ? AND date = ?', [vendorId, today]);

    let menu = rows[0];
    if (!menu) {
      menu = {
        menu_id: 'M' + Date.now().toString().slice(-4),
        vendor_id: vendorId,
        date: today,
        meal_type: 'lunch',
        published: false,
        items: []
      };
    } else {
      menu = {
        ...menu,
        published: Boolean(menu.published),
        items: normalizeMenuItems(menu.items)
      };
    }

    return res.json(menu);
  } catch (err) {
    console.error('Vendor menu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu: ' + err.message });
  }
});

// POST /api/vendor/menu and /api/vendor/:id/menu (Add Menu Item)
router.post(['/menu', '/:id/menu'], async (req, res) => {
  try {
    let vendorId = req.params.id;
    if (!vendorId || vendorId === 'menu') {
      const vendor = await getActiveVendor(req);
      if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
      vendorId = vendor.vendor_id;
    }
    const { name, category, quantity } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    const rows = await db.query('SELECT * FROM daily_menus WHERE vendor_id = ? AND date = ?', [vendorId, today]);
    let items = [];
    let menuId = 'M' + Date.now().toString().slice(-4);

    if (rows.length > 0) {
      menuId = rows[0].menu_id;
      items = normalizeMenuItems(rows[0].items);
    }

    const newItem = {
      item_id: String(Date.now()),
      name: name || 'Special Item',
      category: category || 'Main',
      quantity: quantity || '1 serving'
    };

    items.push(newItem);

    await db.query(
      'INSERT INTO daily_menus (menu_id, vendor_id, date, meal_type, items, published) VALUES (?, ?, ?, "lunch", ?, 1) ON DUPLICATE KEY UPDATE items = VALUES(items), published = 1',
      [menuId, vendorId, today, JSON.stringify(items)]
    );

    return res.status(201).json({ success: true, message: 'Item added to menu', item: newItem });
  } catch (err) {
    console.error('Add menu item error:', err);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// DELETE /api/vendor/menu/:itemId and /api/vendor/:id/menu/:itemId
router.delete(['/menu/:itemId', '/:id/menu/:itemId'], async (req, res) => {
  try {
    let { id: vendorId, itemId } = req.params;
    if (!itemId) {
      itemId = vendorId;
      const vendor = await getActiveVendor(req);
      if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
      vendorId = vendor.vendor_id;
    }
    const today = new Date().toISOString().slice(0, 10);

    const rows = await db.query('SELECT * FROM daily_menus WHERE vendor_id = ? AND date = ?', [vendorId, today]);
    if (rows.length === 0) return res.status(404).json({ error: 'Menu not found' });

    let items = normalizeMenuItems(rows[0].items);
    items = items.filter(i => String(i.item_id) !== String(itemId));

    await db.query('UPDATE daily_menus SET items = ? WHERE menu_id = ?', [JSON.stringify(items), rows[0].menu_id]);

    return res.json({ success: true, message: 'Item deleted from menu' });
  } catch (err) {
    console.error('Delete menu item error:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// PATCH /api/vendor/menu/publish and /api/vendor/:id/menu/publish
router.patch(['/menu/publish', '/:id/menu/publish'], async (req, res) => {
  try {
    let vendorId = req.params.id;
    if (!vendorId || vendorId === 'menu') {
      const vendor = await getActiveVendor(req);
      if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
      vendorId = vendor.vendor_id;
    }
    const today = new Date().toISOString().slice(0, 10);
    await db.query('UPDATE daily_menus SET published = 1 WHERE vendor_id = ? AND date = ?', [vendorId, today]);
    return res.json({ success: true, message: 'Today menu published' });
  } catch (err) {
    console.error('Publish menu error:', err);
    res.status(500).json({ error: 'Failed to publish menu' });
  }
});

// PATCH /api/vendor/subscription/:id/approve (Vendor approves student subscription with ownership & race check)
router.patch('/subscription/:id/approve', requireAuth, requireRole('vendor'), async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await getActiveVendor(req);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

    // Verify subscription ownership
    const subRows = await db.query('SELECT * FROM subscriptions WHERE sub_id = ?', [id]);
    if (subRows.length === 0) return res.status(404).json({ error: 'Subscription not found' });
    const sub = subRows[0];

    if (sub.vendor_id !== vendor.vendor_id) {
      return res.status(403).json({ error: 'Forbidden: You can only approve subscription requests for your own kitchen.' });
    }

    // Atomic conditional UPDATE for approval race resolution
    const result = await db.query(
      'UPDATE subscriptions SET status = "active", approved_by = "vendor", approved_at = NOW() WHERE sub_id = ? AND status = "pending" AND vendor_id = ?',
      [id, vendor.vendor_id]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ error: 'This request has already been processed.' });
    }

    // Generate initial delivery schedule entry upon activation
    try {
      const delCount = await db.query('SELECT COUNT(*) as cnt FROM deliveries');
      const cntVal = (delCount && delCount[0] && delCount[0].cnt !== undefined) ? delCount[0].cnt : 1;
      const delId = 'D' + String(cntVal + 1).padStart(3, '0');
      const today = new Date().toISOString().slice(0, 10);
      const agents = await db.query('SELECT agent_id FROM delivery_agents LIMIT 1');
      const agentId = (agents && agents.length > 0) ? agents[0].agent_id : null;
      await db.query(
        'INSERT INTO deliveries (delivery_id, subscription_id, agent_id, date, meal_type, status, notes) VALUES (?, ?, ?, ?, "lunch", "prepared", "Daily fresh meal delivery") ON DUPLICATE KEY UPDATE status = VALUES(status)',
        [delId, id, agentId, today]
      );
    } catch (delErr) {
      console.warn('Initial delivery generation notice:', delErr.message);
    }

    await logAuditAction(req, 'VENDOR_APPROVE_SUBSCRIPTION', 'subscriptions', id, 'Vendor approved subscription ' + id);

    return res.json({ success: true, message: 'Subscription #' + id + ' approved and activated successfully!' });
  } catch (err) {
    console.error('Vendor approve error:', err);
    return res.status(500).json({ error: 'Failed to approve subscription: ' + err.message });
  }
});

// PATCH /api/vendor/subscription/:id/reject (Vendor rejects student subscription)
router.patch('/subscription/:id/reject', requireAuth, requireRole('vendor'), async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await getActiveVendor(req);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

    // Verify ownership
    const subRows = await db.query('SELECT * FROM subscriptions WHERE sub_id = ?', [id]);
    if (subRows.length === 0) return res.status(404).json({ error: 'Subscription not found' });
    const sub = subRows[0];

    if (sub.vendor_id !== vendor.vendor_id) {
      return res.status(403).json({ error: 'Forbidden: You can only reject subscription requests for your own kitchen.' });
    }

    // Atomic conditional UPDATE
    const result = await db.query(
      'UPDATE subscriptions SET status = "rejected", approved_by = "vendor", approved_at = NOW() WHERE sub_id = ? AND status = "pending" AND vendor_id = ?',
      [id, vendor.vendor_id]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ error: 'This request has already been processed.' });
    }

    await logAuditAction(req, 'VENDOR_REJECT_SUBSCRIPTION', 'subscriptions', id, 'Vendor rejected subscription ' + id);

    return res.json({ success: true, message: 'Subscription request #' + id + ' rejected.' });
  } catch (err) {
    console.error('Vendor reject error:', err);
    return res.status(500).json({ error: 'Failed to reject subscription: ' + err.message });
  }
});

// PATCH /api/vendor/payment/:id/collect (Fix 2: Mark Cash / COD Collected)
router.patch('/payment/:id/collect', requireAuth, requireRole('vendor'), async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await getActiveVendor(req);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

    // Verify ownership: payment belongs to a subscription belonging to this vendor
    const payRows = await db.query(
      `SELECT pay.*, s.vendor_id 
       FROM payments pay 
       JOIN subscriptions s ON pay.subscription_id = s.sub_id 
       WHERE pay.payment_id = ?`,
      [id]
    );

    if (payRows.length === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const pay = payRows[0];
    if (pay.vendor_id !== vendor.vendor_id) {
      return res.status(403).json({ error: 'Forbidden: You can only collect payments for your own subscriptions.' });
    }

    await db.query(
      'UPDATE payments SET status = "collected", collected_at = NOW(), amount_due = 0.00 WHERE payment_id = ?',
      [id]
    );

    await logAuditAction(req, 'VENDOR_MARKED_PAYMENT_COLLECTED', 'payments', id, `Vendor marked payment ${id} collected (Amount: ₹${pay.amount})`);

    return res.json({
      success: true,
      message: `Payment ${id} marked as collected!`,
      payment_id: id,
      status: 'collected'
    });
  } catch (err) {
    console.error('Mark collected error:', err);
    return res.status(500).json({ error: 'Failed to record collection: ' + err.message });
  }
});

// GET /api/vendor/meal-plans and /api/vendor/:id/meal-plans
router.get(['/meal-plans', '/:id/meal-plans'], async (req, res) => {
  try {
    let vendorId = req.params.id;
    if (!vendorId || vendorId === 'meal-plans') {
      const vendor = await getActiveVendor(req);
      if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
      vendorId = vendor.vendor_id;
    }
    const plans = await db.query('SELECT plan_id, vendor_id, name AS plan_name, name, plan_type, price, meals_included, veg_or_nonveg, description, status FROM meal_plans WHERE vendor_id = ? AND status = "active"', [vendorId]);
    return res.json(plans.map(p => ({
      ...p,
      price: parseFloat(p.price),
      veg: p.veg_or_nonveg === 'veg' || p.veg_or_nonveg === 'both',
      meals_per_day: p.meals_included || 1
    })));
  } catch (err) {
    console.error('Meal plans error:', err);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
});

// POST /api/vendor/meal-plans and /api/vendor/:id/meal-plans (Create Meal Plan)
router.post(['/meal-plans', '/:id/meal-plans'], async (req, res) => {
  try {
    let vendorId = req.params.id;
    if (!vendorId || vendorId === 'meal-plans') {
      const vendor = await getActiveVendor(req);
      if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });
      vendorId = vendor.vendor_id;
    }
    const { name, plan_type, price, meals_included, veg_or_nonveg, description } = req.body;
    if (!name || !price) {
      return res.status(422).json({ error: 'Plan name and price are required' });
    }

    const planId = 'P' + vendorId + String(Date.now()).slice(-3);

    await db.query(
      'INSERT INTO meal_plans (plan_id, vendor_id, name, plan_type, price, meals_included, veg_or_nonveg, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "active")',
      [
        planId,
        vendorId,
        name,
        plan_type || 'monthly',
        parseFloat(price) || 2400.00,
        parseInt(meals_included, 10) || 30,
        veg_or_nonveg || 'veg',
        description || ''
      ]
    );

    await logAuditAction(req, 'VENDOR_CREATE_MEAL_PLAN', 'meal_plans', planId, 'Vendor created meal plan ' + name);

    return res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      plan: { plan_id: planId, name, price: parseFloat(price) }
    });
  } catch (err) {
    console.error('Create meal plan error:', err);
    res.status(500).json({ error: 'Failed to create meal plan: ' + err.message });
  }
});

// PATCH /api/vendor/meal-plans/:planId and /api/vendor/meal-plan/:planId (Fix 8: Edit Meal Plan Price & Config)
router.patch(['/meal-plans/:planId', '/meal-plan/:planId', '/:id/meal-plans/:planId'], requireAuth, requireRole('vendor'), async (req, res) => {
  try {
    const { planId } = req.params;
    const vendor = await getActiveVendor(req);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const planRows = await db.query('SELECT * FROM meal_plans WHERE plan_id = ?', [planId]);
    if (planRows.length === 0) return res.status(404).json({ error: 'Meal plan not found' });
    const oldPlan = planRows[0];

    // Ownership check: vendor can only edit their own plans
    if (oldPlan.vendor_id !== vendor.vendor_id) {
      return res.status(403).json({ error: 'Forbidden: You cannot edit another vendor\'s meal plan.' });
    }

    const { name, price, meals_included, veg_or_nonveg, description, status } = req.body;
    const updatedPrice = price !== undefined ? parseFloat(price) : parseFloat(oldPlan.price);
    const updatedMeals = meals_included !== undefined ? parseInt(meals_included, 10) : oldPlan.meals_included;
    const updatedName = name || oldPlan.name;
    const updatedVeg = veg_or_nonveg || oldPlan.veg_or_nonveg;
    const updatedDesc = description !== undefined ? description : oldPlan.description;
    const updatedStatus = status || oldPlan.status;

    await db.query(
      'UPDATE meal_plans SET name = ?, price = ?, meals_included = ?, veg_or_nonveg = ?, description = ?, status = ? WHERE plan_id = ?',
      [updatedName, updatedPrice, updatedMeals, updatedVeg, updatedDesc, updatedStatus, planId]
    );

    await logAuditAction(
      req,
      'VENDOR_UPDATED_MEAL_PLAN',
      'meal_plans',
      planId,
      `Vendor updated meal plan ${planId} price to ₹${updatedPrice}`,
      { old_price: oldPlan.price, old_meals: oldPlan.meals_included },
      { new_price: updatedPrice, new_meals: updatedMeals }
    );

    return res.json({
      success: true,
      message: 'Meal plan updated successfully. Existing subscriptions locked price remains unaffected.',
      plan: {
        plan_id: planId,
        name: updatedName,
        price: updatedPrice,
        meals_included: updatedMeals
      }
    });
  } catch (err) {
    console.error('Update meal plan error:', err);
    return res.status(500).json({ error: 'Failed to update meal plan: ' + err.message });
  }
});

// DELETE /api/vendor/meal-plans/:planId
router.delete(['/meal-plans/:planId', '/:id/meal-plans/:planId'], async (req, res) => {
  try {
    let { id: vendorId, planId } = req.params;
    if (!planId) {
      planId = vendorId;
      const vendor = await getActiveVendor(req);
      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
      vendorId = vendor.vendor_id;
    }

    await db.query('UPDATE meal_plans SET status = "inactive" WHERE plan_id = ? AND vendor_id = ?', [planId, vendorId]);
    await logAuditAction(req, 'VENDOR_DELETE_MEAL_PLAN', 'meal_plans', planId, 'Vendor deactivated meal plan ' + planId);

    return res.json({ success: true, message: 'Meal plan deactivated successfully' });
  } catch (err) {
    console.error('Delete meal plan error:', err);
    res.status(500).json({ error: 'Failed to delete meal plan: ' + err.message });
  }
});

module.exports = router;

