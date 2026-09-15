const express = require('express');
const router = express.Router();
const db = require('../db');
const { logAuditAction } = require('../middleware/auth');

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

    const subCount = await db.query('SELECT COUNT(DISTINCT sub_id) as cnt FROM subscriptions WHERE vendor_id = ? AND status = "active"', [vendor.vendor_id]);
    const delCount = await db.query(`
      SELECT COUNT(*) as total, SUM(CASE WHEN d.status = "delivered" THEN 1 ELSE 0 END) as delivered 
      FROM deliveries d 
      JOIN subscriptions s ON d.subscription_id = s.sub_id 
      WHERE s.vendor_id = ? AND d.date = ?
    `, [vendor.vendor_id, today]);
    const compCount = await db.query('SELECT COUNT(*) as cnt FROM complaints WHERE vendor_id = ? AND (status = "open" OR status = "in_review")', [vendor.vendor_id]);
    const reviewCount = await db.query('SELECT COUNT(*) as cnt FROM ratings WHERE vendor_id = ?', [vendor.vendor_id]);
    const menuRows = await db.query('SELECT * FROM daily_menus WHERE vendor_id = ? AND date = ?', [vendor.vendor_id, today]);
    const plans = await db.query('SELECT plan_id, vendor_id, name AS plan_name, name, plan_type, price, meals_included, veg_or_nonveg, description FROM meal_plans WHERE vendor_id = ? AND status = "active"', [vendor.vendor_id]);

    const rbRows = await db.query(`
      SELECT 
        AVG(taste_score) as taste,
        AVG(hygiene_score) as hygiene,
        AVG(punctuality_score) as punctuality,
        AVG(value_score) as value
      FROM ratings
      WHERE vendor_id = ?
    `, [vendor.vendor_id]);

    const rb = rbRows[0] || {};
    const rating_breakdown = {
      taste: parseFloat(rb.taste) || 4.8,
      hygiene: parseFloat(rb.hygiene) || 4.7,
      punctuality: parseFloat(rb.punctuality) || 4.6,
      value: parseFloat(rb.value) || 4.5
    };

    const recent_ratings = await db.query(`
      SELECT r.rating_id, r.taste_score, r.hygiene_score, r.punctuality_score, r.value_score,
             r.weighted_score AS overall_score, r.review_text AS review, r.created_at,
             c.name AS customer_name, c.locality AS customer_locality
      FROM ratings r
      JOIN customers c ON r.customer_id = c.customer_id
      WHERE r.vendor_id = ?
      ORDER BY r.created_at DESC LIMIT 5
    `, [vendor.vendor_id]);

    const complaints = await db.query(`
      SELECT c.*, cust.name AS customer_name,
             CASE WHEN c.status = 'open' THEN 'pending' ELSE c.status END AS status
      FROM complaints c
      JOIN customers cust ON c.customer_id = cust.customer_id
      WHERE c.vendor_id = ?
      ORDER BY c.created_at DESC
    `, [vendor.vendor_id]);

    const subRows = await db.query(`
      SELECT s.sub_id, s.start_date, s.end_date, s.status,
             c.customer_id, c.name AS customer_name, c.phone AS customer_phone, c.pg_or_flat_name, c.room_no, c.locality,
             p.plan_id, p.name AS plan_name, p.price
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN meal_plans p ON s.plan_id = p.plan_id
      WHERE s.vendor_id = ?
      ORDER BY s.created_at DESC
    `, [vendor.vendor_id]);

    const subscribers = subRows.map(s => ({
      sub_id: s.sub_id,
      start_date: s.start_date,
      end_date: s.end_date,
      status: s.status,
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
        price: parseFloat(s.price) || 2800
      }
    }));

    return res.json({
      vendor: {
        ...vendor,
        city: 'Bhopal'
      },
      stats: {
        active_subscribers: subCount[0].cnt || 0,
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

// PATCH /api/vendor/subscription/:id/approve (Vendor approves student subscription)
router.patch('/subscription/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE subscriptions SET status = "active" WHERE sub_id = ?', [id]);
    await logAuditAction(req, 'VENDOR_APPROVE_SUBSCRIPTION', 'subscriptions', id, 'Vendor approved subscription ' + id);
    return res.json({ success: true, message: 'Subscription #' + id + ' approved!' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to approve subscription' });
  }
});

// PATCH /api/vendor/subscription/:id/reject (Vendor rejects student subscription)
router.patch('/subscription/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE subscriptions SET status = "cancelled" WHERE sub_id = ?', [id]);
    await logAuditAction(req, 'VENDOR_REJECT_SUBSCRIPTION', 'subscriptions', id, 'Vendor rejected subscription ' + id);
    return res.json({ success: true, message: 'Subscription #' + id + ' rejected.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reject subscription' });
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
    const plans = await db.query('SELECT plan_id, vendor_id, name AS plan_name, name, plan_type, price, meals_included, veg_or_nonveg, description FROM meal_plans WHERE vendor_id = ? AND status = "active"', [vendorId]);
    return res.json(plans.map(p => ({
      ...p,
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
