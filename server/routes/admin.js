const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole, logAuditAction } = require('../middleware/auth');

// GET /api/admin
router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Parallelize all independent database operations into a single concurrent roundtrip
    const [
      statsRows,
      vendors,
      customers,
      complaints,
      pendingApprovals,
      pendingSubscriptions
    ] = await Promise.all([
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) AS total_users,
          (SELECT COUNT(*) FROM customers) AS total_students,
          (SELECT COUNT(*) FROM vendors) AS total_vendors,
          (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') AS active_subs,
          (SELECT COUNT(*) FROM subscriptions WHERE status = 'pending') AS pending_subs,
          (SELECT COUNT(*) FROM deliveries WHERE date = ?) AS today_deliveries,
          (SELECT COUNT(*) FROM complaints WHERE status = 'open' OR status = 'in_review') AS pending_complaints,
          (SELECT AVG(avg_rating) FROM vendors) AS platform_avg_rating
      `, [today]),

      // Vendor Performance
      db.query(`
        SELECT 
          v.vendor_id, 
          v.name, 
          v.locality, 
          v.status,
          v.avg_rating AS overall_rating,
          COUNT(DISTINCT s.sub_id) AS active_subscribers,
          COUNT(DISTINCT CASE WHEN d.date = ? THEN d.delivery_id ELSE NULL END) AS today_deliveries,
          COUNT(DISTINCT CASE WHEN c.status = 'open' THEN c.complaint_id ELSE NULL END) AS pending_complaints
        FROM vendors v
        LEFT JOIN subscriptions s ON v.vendor_id = s.vendor_id AND s.status = 'active'
        LEFT JOIN deliveries d ON s.sub_id = d.subscription_id
        LEFT JOIN complaints c ON v.vendor_id = c.vendor_id
        GROUP BY v.vendor_id
        ORDER BY v.avg_rating DESC
      `, [today]),

      // Customer Activity
      db.query(`
        SELECT 
          c.customer_id, 
          c.user_id,
          c.name, 
          c.pg_or_flat_name AS residence, 
          COALESCE(v.name, '—') AS vendor_name, 
          COALESCE(p.name, '—') AS plan_name, 
          COALESCE(s.status, 'none') AS sub_status,
          s.sub_id,
          u.status AS user_status
        FROM customers c
        JOIN users u ON c.user_id = u.user_id
        LEFT JOIN subscriptions s ON c.customer_id = s.customer_id AND (s.status = 'active' OR s.status = 'pending')
        LEFT JOIN vendors v ON s.vendor_id = v.vendor_id
        LEFT JOIN meal_plans p ON s.plan_id = p.plan_id
        ORDER BY 
          CASE WHEN s.status = 'pending' THEN 0 WHEN s.status = 'active' THEN 1 ELSE 2 END,
          c.customer_id ASC
      `),

      // Complaint Overview
      db.query(`
        SELECT 
          c.complaint_id, 
          c.description,
          cust.name AS customer_name, 
          v.name AS vendor_name, 
          c.issue_type, 
          c.created_at, 
          CASE WHEN c.status = 'open' THEN 'pending' ELSE c.status END AS status
        FROM complaints c
        JOIN customers cust ON c.customer_id = cust.customer_id
        JOIN vendors v ON c.vendor_id = v.vendor_id
        ORDER BY c.created_at DESC
      `),

      // Pending User Registrations
      db.query(`
        SELECT u.user_id, u.email, u.role, u.status, u.created_at,
               COALESCE(c.name, v.name, 'New User') AS name,
               COALESCE(c.phone, v.contact, '—') AS phone,
               COALESCE(c.locality, v.locality, 'Campus Area') AS locality,
               c.customer_id, v.vendor_id
        FROM users u
        LEFT JOIN customers c ON u.user_id = c.user_id
        LEFT JOIN vendors v ON u.user_id = v.user_id
        WHERE u.status = 'inactive' AND u.role IN ('customer', 'vendor')
        ORDER BY u.created_at DESC
      `),

      // Pending Subscription Requests Across All Vendors
      db.query(`
        SELECT s.sub_id, s.start_date, s.created_at, s.status, s.locked_price,
               c.customer_id, c.name AS customer_name, c.phone AS customer_phone, c.pg_or_flat_name, c.room_no, c.locality,
               v.vendor_id, v.name AS vendor_name,
               p.plan_id, p.name AS plan_name, p.price,
               pay.payment_id, pay.amount_due, pay.status AS payment_status
        FROM subscriptions s
        JOIN customers c ON s.customer_id = c.customer_id
        JOIN vendors v ON s.vendor_id = v.vendor_id
        JOIN meal_plans p ON s.plan_id = p.plan_id
        LEFT JOIN payments pay ON s.sub_id = pay.subscription_id
        WHERE s.status = 'pending'
        ORDER BY s.created_at DESC
      `)
    ]);

    const stats = statsRows[0] || {};

    return res.json({
      stats: {
        total_users: stats.total_users || 0,
        total_students: stats.total_students || 0,
        total_vendors: stats.total_vendors || 0,
        pending_approvals: pendingApprovals.length,
        pending_subscriptions: stats.pending_subs || 0,
        active_subscriptions: stats.active_subs || 0,
        today_deliveries: stats.today_deliveries || 0,
        pending_complaints: stats.pending_complaints || 0,
        platform_avg_rating: parseFloat(stats.platform_avg_rating) || 4.5
      },
      pending_approvals: pendingApprovals,
      pending_subscriptions: pendingSubscriptions.map(s => ({
        ...s,
        price: s.locked_price !== null ? parseFloat(s.locked_price) : parseFloat(s.price),
        amount_due: s.amount_due !== null ? parseFloat(s.amount_due) : parseFloat(s.price)
      })),
      vendor_performance: vendors.map(v => ({
        ...v,
        overall_rating: parseFloat(v.overall_rating) || 4.5,
        active_subscribers: parseInt(v.active_subscribers, 10) || 0,
        today_deliveries: parseInt(v.today_deliveries, 10) || 0,
        pending_complaints: parseInt(v.pending_complaints, 10) || 0
      })),
      customer_activity: customers,
      complaint_overview: complaints
    });
  } catch (err) {
    console.error('Admin data error:', err);
    return res.status(500).json({ error: 'Failed to fetch admin overview: ' + err.message });
  }
});


// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await db.query(`
      SELECT u.user_id, u.email, u.role, u.status, u.created_at,
             COALESCE(c.name, v.name, 'Administrator') AS full_name,
             c.customer_id, v.vendor_id
      FROM users u
      LEFT JOIN customers c ON u.user_id = c.user_id
      LEFT JOIN vendors v ON u.user_id = v.user_id
      WHERE u.role IN ('customer', 'vendor', 'admin')
      ORDER BY u.user_id ASC
    `);
    return res.json(users);
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id/approve (Approve Pending User / Vendor / Agent)
router.patch('/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const userRows = await db.query('SELECT * FROM users WHERE user_id = ?', [id]);
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userRows[0];

    await db.transaction(async (conn) => {
      await conn.query('UPDATE users SET status = "active" WHERE user_id = ?', [id]);
      if (user.role === 'vendor') {
        await conn.query('UPDATE vendors SET status = "active" WHERE user_id = ?', [id]);
      } else if (user.role === 'delivery_agent') {
        await conn.query('UPDATE delivery_agents SET status = "active" WHERE user_id = ?', [id]);
      }
    });

    await logAuditAction(req, 'ADMIN_APPROVE_USER', 'users', id, 'Admin approved ' + user.role + ' account (' + user.email + ')');

    return res.json({ success: true, message: 'User account ' + user.email + ' approved and granted access!' });
  } catch (err) {
    console.error('Approve user error:', err);
    return res.status(500).json({ error: 'Failed to approve user: ' + err.message });
  }
});

// PATCH /api/admin/users/:id/status (Activate / Suspend / Disable User)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(422).json({ error: 'Invalid status' });
    }

    await db.transaction(async (conn) => {
      await conn.query('UPDATE users SET status = ? WHERE user_id = ?', [status, id]);
      if (status !== 'active') {
        await conn.query('DELETE FROM sessions WHERE user_id = ?', [id]);
      }
      // Sync vendor or agent status if applicable
      await conn.query('UPDATE vendors SET status = ? WHERE user_id = ?', [status, id]);
      await conn.query('UPDATE delivery_agents SET status = ? WHERE user_id = ?', [status, id]);
    });

    await logAuditAction(req, 'ADMIN_USER_STATUS_CHANGE', 'users', id, 'User status changed to ' + status);

    return res.json({ success: true, message: 'User status updated to ' + status });
  } catch (err) {
    console.error('Update user status error:', err);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

// PATCH /api/admin/vendors/:id/status (Activate / Suspend Vendor)
router.patch('/vendors/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(422).json({ error: 'Invalid status' });
    }

    await db.query('UPDATE vendors SET status = ? WHERE vendor_id = ?', [status, id]);
    
    // Also update associated user account
    const vRows = await db.query('SELECT user_id FROM vendors WHERE vendor_id = ?', [id]);
    if (vRows.length > 0) {
      await db.query('UPDATE users SET status = ? WHERE user_id = ?', [status, vRows[0].user_id]);
      if (status !== 'active') {
        await db.query('DELETE FROM sessions WHERE user_id = ?', [vRows[0].user_id]);
      }
    }

    await logAuditAction(req, 'ADMIN_VENDOR_STATUS_CHANGE', 'vendors', id, 'Vendor status changed to ' + status);

    return res.json({ success: true, message: 'Vendor status updated to ' + status });
  } catch (err) {
    console.error('Update vendor status error:', err);
    return res.status(500).json({ error: 'Failed to update vendor status' });
  }
});

// DELETE /api/admin/vendors/:id (Delete Vendor with integrity cleanup)
router.delete('/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vRows = await db.query('SELECT user_id, name FROM vendors WHERE vendor_id = ?', [id]);
    if (vRows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    const vendor = vRows[0];

    await db.transaction(async (conn) => {
      // Cancel active subscriptions for this vendor
      await conn.query('UPDATE subscriptions SET status = "cancelled" WHERE vendor_id = ?', [id]);
      // Soft-delete or update vendor status
      await conn.query('UPDATE vendors SET status = "inactive" WHERE vendor_id = ?', [id]);
      await conn.query('UPDATE users SET status = "inactive" WHERE user_id = ?', [vendor.user_id]);
      await conn.query('DELETE FROM sessions WHERE user_id = ?', [vendor.user_id]);
    });

    await logAuditAction(req, 'ADMIN_DELETE_VENDOR', 'vendors', id, 'Vendor ' + vendor.name + ' deactivated/removed by admin');

    return res.json({ success: true, message: 'Vendor ' + vendor.name + ' deactivated and unlisted successfully' });
  } catch (err) {
    console.error('Delete vendor error:', err);
    return res.status(500).json({ error: 'Failed to delete vendor: ' + err.message });
  }
});

// DELETE /api/admin/users/:id (Delete/Deactivate User)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (String(id) === '1') {
      return res.status(403).json({ error: 'Cannot delete primary Administrator account.' });
    }

    await db.transaction(async (conn) => {
      await conn.query('UPDATE users SET status = "inactive" WHERE user_id = ?', [id]);
      await conn.query('DELETE FROM sessions WHERE user_id = ?', [id]);
    });

    await logAuditAction(req, 'ADMIN_DEACTIVATE_USER', 'users', id, 'User ID ' + id + ' deactivated by admin');

    return res.json({ success: true, message: 'User deactivated successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to deactivate user: ' + err.message });
  }
});

// GET /api/admin/complaints
router.get('/complaints', async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT c.*, cust.name AS customer_name, v.name AS vendor_name,
             CASE WHEN c.status = 'open' THEN 'pending' ELSE c.status END AS status
      FROM complaints c
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN vendors v ON c.vendor_id = v.vendor_id
      ORDER BY c.created_at DESC
    `);
    return res.json(rows);
  } catch (err) {
    console.error('Admin complaints error:', err);
    return res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// PATCH /api/admin/complaints/:id/resolve (Resolve Complaint)
router.patch('/complaints/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    await db.query(
      'UPDATE complaints SET status = "resolved", resolution_notes = ?, resolved_date = CURRENT_TIMESTAMP WHERE complaint_id = ?',
      [resolution_notes || 'Resolved by Admin: refund/replacement issued.', id]
    );

    await logAuditAction(req, 'RESOLVE_COMPLAINT', 'complaints', id, 'Complaint resolved: ' + (resolution_notes || 'Action taken'));

    return res.json({ success: true, message: 'Complaint ticket #' + id + ' marked as Resolved.' });
  } catch (err) {
    console.error('Resolve complaint error:', err);
    return res.status(500).json({ error: 'Failed to resolve complaint' });
  }
});

// PATCH /api/admin/complaints/:id/reject (Reject Complaint)
router.patch('/complaints/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.query(
      'UPDATE complaints SET status = "rejected", resolution_notes = ?, resolved_date = CURRENT_TIMESTAMP WHERE complaint_id = ?',
      [reason || 'Rejected after review: does not meet policy criteria.', id]
    );

    await logAuditAction(req, 'REJECT_COMPLAINT', 'complaints', id, 'Complaint rejected: ' + (reason || 'Policy criteria'));

    return res.json({ success: true, message: 'Complaint ticket #' + id + ' rejected.' });
  } catch (err) {
    console.error('Reject complaint error:', err);
    return res.status(500).json({ error: 'Failed to reject complaint' });
  }
});

// PATCH /api/admin/subscription/:id/approve (Admin approves pending subscription across any vendor)
router.patch('/subscription/:id/approve', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Atomic conditional UPDATE for approval race resolution
    const result = await db.query(
      'UPDATE subscriptions SET status = "active", approved_by = "admin", approved_at = NOW() WHERE sub_id = ? AND status = "pending"',
      [id]
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

    await logAuditAction(req, 'ADMIN_APPROVE_SUBSCRIPTION', 'subscriptions', id, 'Admin approved subscription ' + id);

    return res.json({ success: true, message: 'Subscription #' + id + ' approved by Admin and activated!' });
  } catch (err) {
    console.error('Admin approve subscription error:', err);
    return res.status(500).json({ error: 'Failed to approve subscription: ' + err.message });
  }
});

// PATCH /api/admin/subscription/:id/reject (Admin rejects pending subscription)
router.patch('/subscription/:id/reject', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Atomic conditional UPDATE
    const result = await db.query(
      'UPDATE subscriptions SET status = "rejected", approved_by = "admin", approved_at = NOW() WHERE sub_id = ? AND status = "pending"',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ error: 'This request has already been processed.' });
    }

    await logAuditAction(req, 'ADMIN_REJECT_SUBSCRIPTION', 'subscriptions', id, 'Admin rejected subscription ' + id);

    return res.json({ success: true, message: 'Subscription request #' + id + ' rejected by Admin.' });
  } catch (err) {
    console.error('Admin reject subscription error:', err);
    return res.status(500).json({ error: 'Failed to reject subscription: ' + err.message });
  }
});

// GET /api/admin/subscriptions (Admin view all subscriptions across platform)
router.get('/subscriptions', async (req, res) => {
  try {
    const subs = await db.query(`
      SELECT 
        s.sub_id,
        s.customer_id,
        s.plan_id,
        s.vendor_id,
        s.start_date,
        s.end_date,
        s.status,
        s.approved_by,
        s.approved_at,
        s.mode,
        COALESCE(s.locked_price, p.price) AS price,
        COALESCE(s.locked_meals_included, p.meals_included) AS meals_included,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.pg_or_flat_name,
        c.room_no,
        c.locality AS customer_locality,
        v.name AS vendor_name,
        p.name AS plan_name,
        COALESCE(pay.amount_due, s.locked_price, p.price) AS amount_due,
        COALESCE(pay.status, 'pending_cash') AS payment_status
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN vendors v ON s.vendor_id = v.vendor_id
      JOIN meal_plans p ON s.plan_id = p.plan_id
      LEFT JOIN payments pay ON s.sub_id = pay.subscription_id
      ORDER BY 
        CASE WHEN s.status = 'pending' THEN 0 WHEN s.status = 'active' THEN 1 ELSE 2 END,
        s.created_at DESC
    `);
    return res.json(subs);
  } catch (err) {
    console.error('Fetch admin subscriptions error:', err);
    return res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// POST /api/admin/purge-dummy-data (Admin purges all test/dummy data)
router.post('/purge-dummy-data', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await db.transaction(async (conn) => {
      // 1. Delete dummy complaints
      await conn.query(`
        DELETE FROM complaints 
        WHERE customer_id IN (SELECT customer_id FROM customers WHERE email LIKE '%@tiffintrack.demo' OR email LIKE '%dummy%')
      `);
      
      // 2. Delete dummy deliveries, payments, skip requests, and subscriptions for dummy customers
      await conn.query(`
        DELETE FROM deliveries 
        WHERE subscription_id IN (SELECT sub_id FROM subscriptions WHERE customer_id IN (SELECT customer_id FROM customers WHERE email LIKE '%@tiffintrack.demo'))
      `);
      await conn.query(`
        DELETE FROM payments 
        WHERE subscription_id IN (SELECT sub_id FROM subscriptions WHERE customer_id IN (SELECT customer_id FROM customers WHERE email LIKE '%@tiffintrack.demo'))
      `);
      await conn.query(`
        DELETE FROM skip_requests 
        WHERE customer_id IN (SELECT customer_id FROM customers WHERE email LIKE '%@tiffintrack.demo')
      `);
      await conn.query(`
        DELETE FROM group_members 
        WHERE customer_id IN (SELECT customer_id FROM customers WHERE email LIKE '%@tiffintrack.demo')
      `);
      await conn.query(`
        DELETE FROM menu_votes 
        WHERE customer_id IN (SELECT customer_id FROM customers WHERE email LIKE '%@tiffintrack.demo')
      `);
      await conn.query(`
        DELETE FROM meal_customizations 
        WHERE customer_id IN (SELECT customer_id FROM customers WHERE email LIKE '%@tiffintrack.demo')
      `);
      await conn.query(`
        DELETE FROM subscriptions 
        WHERE customer_id IN (SELECT customer_id FROM customers WHERE email LIKE '%@tiffintrack.demo')
      `);
      await conn.query(`
        DELETE FROM ratings 
        WHERE customer_id IN (SELECT customer_id FROM customers WHERE email LIKE '%@tiffintrack.demo')
      `);

      // 3. Delete dummy delivery agents
      try {
        await conn.query(`DELETE FROM delivery_agents WHERE email LIKE '%@tiffintrack.demo'`);
      } catch (e) {}

      // 4. Delete dummy customer profiles & user logins (except admin and real users)
      await conn.query(`DELETE FROM customers WHERE email LIKE '%@tiffintrack.demo'`);
      await conn.query(`DELETE FROM users WHERE role = 'delivery_agent' OR (role = 'customer' AND email LIKE '%@tiffintrack.demo')`);
      
      // Also delete any orphan complaints
      await conn.query(`DELETE FROM complaints WHERE customer_id NOT IN (SELECT customer_id FROM customers)`);
    });

    await logAuditAction(req, 'PURGE_DUMMY_DATA', 'system', 'all', 'Admin purged dummy test users and dummy complaints');
    return res.json({ success: true, message: 'Dummy test accounts, sample complaints, and dummy data successfully purged!' });
  } catch (err) {
    console.error('Purge dummy data error:', err);
    return res.status(500).json({ error: 'Failed to purge dummy data: ' + err.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');
    return res.json(logs);
  } catch (err) {
    console.error('Audit logs error:', err);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;

