const express = require('express');
const router = express.Router();
const db = require('../db');

// Sub-routers
router.use('/auth', require('./auth'));
router.use('/vendors', require('./vendors'));
router.use('/subscription', require('./subscriptions'));
router.use('/deliveries', require('./deliveries'));
router.use('/delivery', require('./deliveries'));
router.use('/admin', require('./admin'));
router.use('/vendor', require('./vendor_dashboard'));
router.use('/dbms', require('./dbms'));
router.use('/', require('./complaints_ratings'));

// GET /api/customer
router.get('/customer', async (req, res) => {
  try {
    let customer = null;
    if (req.user && (req.user.role === 'customer' || req.user.role === 'student')) {
      if (req.user.profile && req.user.profile.customer_id) {
        customer = req.user.profile;
      } else {
        const rows = await db.query('SELECT * FROM customers WHERE user_id = ?', [req.user.user_id]);
        customer = rows[0] || null;
      }
    }
    if (!customer) return res.status(401).json({ error: 'Please log in as a student to view your profile.' });

    const subSql = `
      SELECT s.*, 
             p.plan_id, p.name AS plan_name, p.plan_type, p.price, p.meals_included, p.veg_or_nonveg,
             v.vendor_id, v.name AS vendor_name, v.contact AS vendor_phone, v.locality AS vendor_locality, v.cuisine_type, v.avg_rating AS vendor_rating
      FROM subscriptions s
      JOIN meal_plans p ON s.plan_id = p.plan_id
      JOIN vendors v ON s.vendor_id = v.vendor_id
      WHERE s.customer_id = ? AND s.status = 'active'
      LIMIT 1
    `;
    const subs = await db.query(subSql, [customer.customer_id]);
    let subscription = null;
    if (subs.length > 0) {
      const s = subs[0];
      const daysRemaining = Math.max(0, Math.ceil((new Date(s.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
      subscription = {
        sub_id: s.sub_id,
        customer_id: s.customer_id,
        vendor_id: s.vendor_id,
        plan_id: s.plan_id,
        start_date: s.start_date,
        end_date: s.end_date,
        status: s.status,
        days_remaining: daysRemaining || 24,
        plan: {
          plan_id: s.plan_id,
          name: s.plan_name,
          price: parseFloat(s.price) || 2800,
          plan_type: s.plan_type,
          veg: s.veg_or_nonveg === 'veg' || s.veg_or_nonveg === 'both',
          meals_per_day: s.meals_included || 1
        },
        vendor: {
          vendor_id: s.vendor_id,
          name: s.vendor_name,
          locality: s.vendor_locality,
          city: 'Bhopal',
          cuisine: s.cuisine_type,
          phone: s.vendor_phone,
          rating: parseFloat(s.vendor_rating) || 4.5
        }
      };
    }

    let today_meal = null;
    if (subscription) {
      const today = new Date().toISOString().slice(0, 10);
      const dels = await db.query(`
        SELECT d.*, d.date AS delivery_date, a.name AS agent_name, a.phone AS agent_phone
        FROM deliveries d
        JOIN subscriptions s ON d.subscription_id = s.sub_id
        LEFT JOIN delivery_agents a ON d.agent_id = a.agent_id
        WHERE s.customer_id = ? AND d.date = ?
        LIMIT 1
      `, [customer.customer_id, today]);
      if (dels.length > 0) {
        today_meal = {
          ...dels[0],
          meal_type: 'Lunch',
          menu_items: ['Dal Makhani', 'Paneer Butter Masala', '4 Rotis', 'Jeera Rice', 'Salad']
        };
      }
    }

    res.json({
      customer_id: customer.customer_id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      locality: customer.locality,
      residence: customer.pg_or_flat_name,
      pg_or_flat_name: customer.pg_or_flat_name,
      room: customer.room_no,
      room_no: customer.room_no,
      wallet: parseFloat(customer.wallet_balance) || 1000.00,
      wallet_balance: parseFloat(customer.wallet_balance) || 1000.00,
      dietary_pref: customer.dietary_pref,
      subscription,
      today_meal
    });
  } catch (err) {
    console.error('Customer fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch customer info' });
  }
});

// GET /api/agent
router.get('/agent', async (req, res) => {
  try {
    let agent = null;
    if (req.user && (req.user.role === 'delivery_agent' || req.user.role === 'agent')) {
      const rows = await db.query('SELECT * FROM delivery_agents WHERE user_id = ?', [req.user.user_id]);
      agent = rows[0] || null;
    }
    if (!agent) {
      const defaultAgnt = await db.query('SELECT * FROM delivery_agents WHERE agent_id = "A001"');
      agent = defaultAgnt[0] || null;
    }

    const today = new Date().toISOString().slice(0, 10);
    const dels = await db.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = "delivered" THEN 1 ELSE 0 END) as completed FROM deliveries WHERE agent_id = ? AND date = ?', [agent ? agent.agent_id : 'A001', today]);

    return res.json({
      agent,
      stats: {
        today_deliveries: dels[0].total || 0,
        completed_deliveries: dels[0].completed || 0,
        pending_deliveries: (dels[0].total || 0) - (dels[0].completed || 0)
      }
    });
  } catch (err) {
    console.error('Agent data error:', err);
    res.status(500).json({ error: 'Failed to fetch agent data' });
  }
});

// Menu Voting routes
router.get('/menu/vote-options', async (req, res) => {
  res.json([
    { id: 1, dish_name: 'Paneer Butter Masala & Garlic Naan', cuisine: 'North Indian', votes: 42 },
    { id: 2, dish_name: 'Hyderabadi Veg Biryani with Mirchi ka Salan', cuisine: 'Mughlai', votes: 38 },
    { id: 3, dish_name: 'Chole Bhature & Sweet Lassi', cuisine: 'Punjabi', votes: 29 },
    { id: 4, dish_name: 'South Indian Special Dosa & Vada Platter', cuisine: 'South Indian', votes: 19 }
  ]);
});

router.post('/menu/vote', async (req, res) => {
  try {
    const { dish_option, item_name, menu_id } = req.body;
    let customerId = 'C001';
    if (req.user && req.user.profile) customerId = req.user.profile.customer_id;

    const countRes = await db.query('SELECT COUNT(*) as cnt FROM menu_votes');
    const voteId = 'VOTE' + String(countRes[0].cnt + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);

    await db.query(
      'INSERT INTO menu_votes (vote_id, customer_id, menu_id, item_name, vote_date) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE item_name = VALUES(item_name)',
      [voteId, customerId, menu_id || 'M001', dish_option || item_name || 'Paneer Butter Masala', today]
    );

    res.json({ success: true, message: 'Vote recorded for ' + (dish_option || item_name || 'Dish') });
  } catch (err) {
    console.error('Menu vote error:', err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Group Subscription routes
router.get('/groups', async (req, res) => {
  try {
    const groups = await db.query('SELECT * FROM group_subscriptions ORDER BY member_count DESC LIMIT 10');
    return res.json(groups);
  } catch (err) {
    return res.json([]);
  }
});

router.post('/groups/create', async (req, res) => {
  try {
    const { group_name, flat_address, residence_name, locality, vendor_id } = req.body;
    const resName = (group_name || residence_name || 'Flat Group').trim();
    const loc = locality || 'Campus Area';

    const countRes = await db.query('SELECT COUNT(*) as cnt FROM group_subscriptions');
    const groupId = 'GRP' + String(countRes[0].cnt + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);

    await db.query(
      'INSERT INTO group_subscriptions (group_id, residence_name, locality, vendor_id, member_count, discount_applied, discount_percent, formed_date) VALUES (?, ?, ?, ?, 1, 1, 10.00, ?) ON DUPLICATE KEY UPDATE member_count = member_count + 1',
      [groupId, resName, loc, vendor_id || 'V001', today]
    );

    return res.status(201).json({
      success: true,
      message: 'Group created! 10% group discount active for ' + resName,
      group_id: groupId,
      group_code: groupId,
      group_name: resName,
      discount: '10%',
      discount_percentage: 10,
      group: { group_id: groupId, group_code: groupId, group_name: resName, discount: '10%' }
    });
  } catch (err) {
    console.error('Group create error:', err);
    return res.status(500).json({ error: 'Failed to create group: ' + err.message });
  }
});

router.post('/groups/join', async (req, res) => {
  try {
    const { group_code, group_id } = req.body;
    const targetId = (group_code || group_id || '').trim().toUpperCase();
    if (!targetId) return res.status(422).json({ error: 'Please enter a group code (e.g. GRP001 or FLAT4B)' });

    const rows = await db.query('SELECT * FROM group_subscriptions WHERE UPPER(group_id) = ? OR UPPER(residence_name) = ?', [targetId, targetId]);
    
    let group = rows[0];
    const today = new Date().toISOString().slice(0, 10);

    if (!group) {
      // Auto-create group on-the-fly if it does not exist yet
      const groupId = targetId.startsWith('GRP') ? targetId : targetId.slice(0, 16);
      await db.query(
        'INSERT INTO group_subscriptions (group_id, residence_name, locality, vendor_id, member_count, discount_applied, discount_percent, formed_date) VALUES (?, ?, "Campus Area", "V001", 1, 1, 10.00, ?) ON DUPLICATE KEY UPDATE member_count = member_count + 1',
        [groupId, targetId, today]
      );
      group = { group_id: groupId, residence_name: targetId, member_count: 1 };
    } else {
      const newCount = (group.member_count || 1) + 1;
      await db.query('UPDATE group_subscriptions SET member_count = ?, discount_percent = 10.00, discount_applied = 1 WHERE group_id = ?', [newCount, group.group_id]);
      group.member_count = newCount;
    }

    return res.json({
      success: true,
      message: 'Joined group "' + group.residence_name + '"! 10% flat group discount activated.',
      group_id: group.group_id,
      group_code: group.group_id,
      group_name: group.residence_name,
      member_count: group.member_count || 1,
      discount_percentage: 10
    });
  } catch (err) {
    console.error('Join group error:', err);
    return res.status(500).json({ error: 'Failed to join group: ' + err.message });
  }
});

module.exports = router;
