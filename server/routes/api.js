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

const { logAuditAction } = require('../middleware/auth');
const { getGroupDiscountPercent } = require('../utils/discounts');

// Menu Voting routes
router.get('/menu/vote-options', async (req, res) => {
  try {
    let customerId = 'C001';
    let defaultVendor = 'V001';

    if (req.user && req.user.profile && req.user.profile.customer_id) {
      customerId = req.user.profile.customer_id;
      const subRows = await db.query(
        'SELECT vendor_id FROM subscriptions WHERE customer_id = ? AND status IN ("active", "pending") ORDER BY FIELD(status, "active", "pending") LIMIT 1',
        [customerId]
      );
      if (subRows.length > 0) defaultVendor = subRows[0].vendor_id;
    }

    const vendorId = req.query.vendor_id || defaultVendor;
    const today = new Date().toISOString().slice(0, 10);

    const voteCounts = await db.query(
      'SELECT item_name, COUNT(*) as cnt FROM menu_votes WHERE vendor_id = ? GROUP BY item_name',
      [vendorId]
    );

    const voteMap = {};
    for (const v of voteCounts) {
      voteMap[v.item_name.toLowerCase()] = parseInt(v.cnt, 10);
    }

    const baseOptions = [
      { id: 1, dish_name: 'Paneer Butter Masala', cuisine: 'North Indian', description: 'Rich creamy tomato gravy with cottage cheese' },
      { id: 2, dish_name: 'Rajma Chawal Special', cuisine: 'Punjabi', description: 'Slow-cooked spiced red kidney beans' },
      { id: 3, dish_name: 'Hyderabadi Veg Biryani', cuisine: 'Mughlai', description: 'Fragrant basmati rice served with raita' },
      { id: 4, dish_name: 'Chole Bhature Platter', cuisine: 'Delhi Style', description: 'Authentic Amritsari chana with bhature' }
    ];

    const options = baseOptions.map(opt => {
      const votes = voteMap[opt.dish_name.toLowerCase()] || 0;
      return {
        ...opt,
        votes
      };
    });

    // Check if user already voted today
    const userVotes = await db.query(
      'SELECT item_name FROM menu_votes WHERE customer_id = ? AND vendor_id = ? AND vote_date = ? LIMIT 1',
      [customerId, vendorId, today]
    );

    const userVoted = userVotes.length > 0 ? userVotes[0].item_name : null;

    res.json({
      vendor_id: vendorId,
      options,
      user_voted: userVoted
    });
  } catch (err) {
    console.error('Fetch vote options error:', err);
    res.status(500).json({ error: 'Failed to fetch voting options' });
  }
});

// POST /api/menu/vote (Fix 6: Active subscriber guard + 409 uniqueness check + Audit log)
router.post('/menu/vote', async (req, res) => {
  try {
    const { dish_option, item_name, menu_id } = req.body;
    let customerId = 'C001';
    if (req.user && req.user.profile && req.user.profile.customer_id) {
      customerId = req.user.profile.customer_id;
    }

    let vendorId = req.body.vendor_id;
    const selectedDish = (dish_option || item_name || 'Paneer Butter Masala').trim();
    const today = new Date().toISOString().slice(0, 10);

    // If vendor_id not explicitly supplied in body, find customer's active vendor
    if (!vendorId) {
      const activeSub = await db.query(
        'SELECT vendor_id FROM subscriptions WHERE customer_id = ? AND status = "active" LIMIT 1',
        [customerId]
      );
      vendorId = activeSub.length > 0 ? activeSub[0].vendor_id : 'V001';
    }

    // Fix 6 Guard 1: Verify customer is an ACTIVE subscriber of that vendor (403 if not)
    const subCheck = await db.query(
      'SELECT sub_id FROM subscriptions WHERE customer_id = ? AND vendor_id = ? AND status = "active" LIMIT 1',
      [customerId, vendorId]
    );

    if (subCheck.length === 0) {
      return res.status(403).json({
        error: 'Forbidden: Only active subscribers of this kitchen can cast a menu vote.'
      });
    }

    // Find or default menu_id
    let targetMenuId = menu_id;
    if (!targetMenuId) {
      const menuRows = await db.query(
        'SELECT menu_id FROM daily_menus WHERE vendor_id = ? AND date = ? LIMIT 1',
        [vendorId, today]
      );
      targetMenuId = menuRows.length > 0 ? menuRows[0].menu_id : 'M001';
    }

    // Fix 6 Guard 2: Check duplicate vote constraint for (customer_id, menu_id, vote_date) -> 409
    const existingVote = await db.query(
      'SELECT vote_id FROM menu_votes WHERE customer_id = ? AND (menu_id = ? OR vendor_id = ?) AND vote_date = ? LIMIT 1',
      [customerId, targetMenuId, vendorId, today]
    );

    if (existingVote.length > 0) {
      return res.status(409).json({
        error: 'You have already voted for today\'s community menu selection. Duplicate votes are prohibited.'
      });
    }

    const countRes = await db.query('SELECT COUNT(*) as cnt FROM menu_votes');
    const voteId = 'VOTE' + String(countRes[0].cnt + 1).padStart(3, '0');

    await db.query(
      'INSERT INTO menu_votes (vote_id, customer_id, vendor_id, menu_id, item_name, vote_date) VALUES (?, ?, ?, ?, ?, ?)',
      [voteId, customerId, vendorId, targetMenuId, selectedDish, today]
    );

    // Audit log
    await logAuditAction(
      req,
      'CUSTOMER_CAST_MENU_VOTE',
      'menu_votes',
      voteId,
      `Customer cast vote for dish "${selectedDish}" (Vendor: ${vendorId})`
    );

    res.json({
      success: true,
      message: 'Vote recorded for ' + selectedDish,
      dish_name: selectedDish,
      vote_id: voteId
    });
  } catch (err) {
    console.error('Menu vote error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'You have already voted for today\'s menu selection.' });
    }
    res.status(500).json({ error: 'Failed to record vote: ' + err.message });
  }
});

// Group Subscription routes (Add-on 3: Centralized Discount Tiers)
router.get('/groups', async (req, res) => {
  try {
    const groups = await db.query('SELECT * FROM group_subscriptions ORDER BY member_count DESC LIMIT 10');
    return res.json(groups);
  } catch (err) {
    return res.json([]);
  }
});

// POST /api/groups/create
router.post('/groups/create', async (req, res) => {
  try {
    const { group_name, flat_address, residence_name, locality, vendor_id } = req.body;
    const resName = (group_name || residence_name || 'Flat Group').trim();
    const loc = locality || 'Campus Area';
    const targetVendor = vendor_id || 'V001';

    let customerId = null;
    if (req.user && req.user.profile && req.user.profile.customer_id) {
      customerId = req.user.profile.customer_id;
    }

    const countRes = await db.query('SELECT COUNT(*) as cnt FROM group_subscriptions');
    const groupId = 'GRP' + String(countRes[0].cnt + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);

    // Initial group creation starts with 1 member: discount = 0%
    await db.query(
      'INSERT INTO group_subscriptions (group_id, residence_name, locality, vendor_id, member_count, discount_applied, discount_percent, formed_date) VALUES (?, ?, ?, ?, 1, 0, 0.00, ?) ON DUPLICATE KEY UPDATE member_count = member_count + 1',
      [groupId, resName, loc, targetVendor, today]
    );

    // Link customer's active/pending subscription to group_id
    if (customerId) {
      await db.query(
        'UPDATE subscriptions SET group_id = ? WHERE customer_id = ? AND status IN ("active", "pending")',
        [groupId, customerId]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Group created! Invite 2 more roommates (Min 3 members) to unlock the 5% tier (10% for 5+).',
      group_id: groupId,
      group_code: groupId,
      group_name: resName,
      member_count: 1,
      min_members_needed: 3,
      members_remaining: 2,
      discount_unlocked: false,
      discount_percentage: 0,
      group: { group_id: groupId, group_code: groupId, group_name: resName, member_count: 1, discount_unlocked: false }
    });
  } catch (err) {
    console.error('Group create error:', err);
    return res.status(500).json({ error: 'Failed to create group: ' + err.message });
  }
});

// POST /api/groups/join (Fix 1: NEVER touches locked_price + Fix 2: Centralized Tiers: 3-4 -> 5%, 5+ -> 10% + Fix 6: Audit log)
router.post('/groups/join', async (req, res) => {
  try {
    const { group_code, group_id } = req.body;
    const targetId = (group_code || group_id || '').trim().toUpperCase();
    if (!targetId) return res.status(422).json({ error: 'Please enter a group code (e.g. GRP001 or FLAT4B)' });

    let customerId = null;
    if (req.user && req.user.profile && req.user.profile.customer_id) {
      customerId = req.user.profile.customer_id;
    }

    const rows = await db.query('SELECT * FROM group_subscriptions WHERE UPPER(group_id) = ? OR UPPER(residence_name) = ?', [targetId, targetId]);
    
    let group = rows[0];
    const today = new Date().toISOString().slice(0, 10);
    let newCount = 1;

    if (!group) {
      // Auto-create group on-the-fly starting with 1 member
      const genGroupId = targetId.startsWith('GRP') ? targetId : targetId.slice(0, 16);
      await db.query(
        'INSERT INTO group_subscriptions (group_id, residence_name, locality, vendor_id, member_count, discount_applied, discount_percent, formed_date) VALUES (?, ?, "Campus Area", "V001", 1, 0, 0.00, ?) ON DUPLICATE KEY UPDATE member_count = member_count + 1',
        [genGroupId, targetId, today]
      );
      group = { group_id: genGroupId, residence_name: targetId, member_count: 1 };
      newCount = 1;
    } else {
      newCount = (group.member_count || 1) + 1;
      
      // Fix 2: Centralized discount tiers (3-4 members -> 5%, 5+ members -> 10%)
      const discountPercent = getGroupDiscountPercent(newCount);
      const isDiscountApplied = discountPercent > 0 ? 1 : 0;

      await db.query(
        'UPDATE group_subscriptions SET member_count = ?, discount_percent = ?, discount_applied = ? WHERE group_id = ?',
        [newCount, discountPercent, isDiscountApplied, group.group_id]
      );
      group.member_count = newCount;
    }

    const effectiveGroupId = group.group_id;

    // Link current student's subscription to this group_id
    if (customerId) {
      await db.query(
        'UPDATE subscriptions SET group_id = ? WHERE customer_id = ? AND status IN ("active", "pending")',
        [effectiveGroupId, customerId]
      );
    }

    // Fix 2: Calculate centralized discount percentage
    const discountPercent = getGroupDiscountPercent(newCount);
    const discountUnlocked = discountPercent > 0;
    const needed = Math.max(0, 3 - newCount);

    // Fix 1: Apply discount ONLY to payments.amount_due, NEVER to subscriptions.locked_price!
    if (discountUnlocked) {
      await db.query(`
        UPDATE payments pay
        JOIN subscriptions sub ON pay.subscription_id = sub.sub_id
        SET pay.amount_due = ROUND(sub.locked_price * (1 - (? / 100)), 2)
        WHERE sub.group_id = ? AND pay.status = 'pending_cash' AND pay.amount_due > 0
      `, [discountPercent, effectiveGroupId]);

      // Fix 6: Audit log group discount application
      await logAuditAction(
        req,
        'GROUP_DISCOUNT_APPLIED',
        'group_subscriptions',
        effectiveGroupId,
        `Group discount tier of ${discountPercent}% applied for group ${effectiveGroupId} (${newCount} members). Payments amount_due updated (locked_price preserved).`
      );
    }

    let message = '';
    if (discountUnlocked) {
      message = `🎉 Group Tier Reached (${newCount} members)! ${discountPercent}% Flat Group Discount is now ACTIVE on pending bills for all roommates!`;
    } else {
      message = `Joined "${group.residence_name}"! Current members: ${newCount}/3. Need ${needed} more roommate(s) to unlock the 5% tier.`;
    }

    return res.json({
      success: true,
      message,
      group_id: effectiveGroupId,
      group_code: effectiveGroupId,
      group_name: group.residence_name,
      member_count: newCount,
      min_members_needed: 3,
      members_remaining: needed,
      discount_unlocked: discountUnlocked,
      discount_percentage: discountPercent
    });
  } catch (err) {
    console.error('Join group error:', err);
    return res.status(500).json({ error: 'Failed to join group: ' + err.message });
  }
});

module.exports = router;
