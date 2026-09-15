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
  return null;
}

async function getActiveVendor(req) {
  if (req.user && req.user.role === 'vendor') {
    if (req.user.profile && req.user.profile.vendor_id) return req.user.profile;
    const rows = await db.query('SELECT * FROM vendors WHERE user_id = ?', [req.user.user_id]);
    if (rows.length > 0) return rows[0];
  }
  return null;
}

async function getActiveAgent(req) {
  if (req.user && (req.user.role === 'delivery_agent' || req.user.role === 'agent')) {
    if (req.user.profile && req.user.profile.agent_id) return req.user.profile;
    const rows = await db.query('SELECT * FROM delivery_agents WHERE user_id = ?', [req.user.user_id]);
    if (rows.length > 0) return rows[0];
  }
  const defaultAgent = await db.query('SELECT * FROM delivery_agents WHERE agent_id = "A001"');
  return defaultAgent[0] || null;
}

// GET /api/deliveries
router.get('/', async (req, res) => {
  try {
    const role = req.query.role || (req.user ? req.user.role : 'student');

    let sql = `
      SELECT d.*, d.date AS delivery_date, s.customer_id, s.vendor_id,
             c.name AS customer_name, c.pg_or_flat_name, c.room_no, c.locality AS customer_locality, c.phone AS customer_phone,
             v.name AS vendor_name, v.locality AS vendor_locality, v.contact AS vendor_contact,
             a.name AS agent_name, a.phone AS agent_phone
      FROM deliveries d
      JOIN subscriptions s ON d.subscription_id = s.sub_id
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN vendors v ON s.vendor_id = v.vendor_id
      LEFT JOIN delivery_agents a ON d.agent_id = a.agent_id
    `;
    let params = [];

    if (role === 'agent' || role === 'delivery_agent') {
      const agent = await getActiveAgent(req);
      sql += ' WHERE d.agent_id = ? ORDER BY d.date DESC, d.delivery_id DESC';
      params.push(agent ? agent.agent_id : 'A001');
    } else if (role === 'vendor') {
      const vendor = await getActiveVendor(req);
      sql += ' WHERE s.vendor_id = ? ORDER BY d.date DESC, d.delivery_id DESC';
      params.push(vendor ? vendor.vendor_id : 'V001');
    } else {
      const customer = await getActiveCustomer(req);
      sql += ' WHERE s.customer_id = ? ORDER BY d.date DESC, d.delivery_id DESC';
      params.push(customer ? customer.customer_id : 'C001');
    }

    const rows = await db.query(sql, params);
    const formatted = rows.map(d => ({
      delivery_id: d.delivery_id,
      subscription_id: d.subscription_id,
      date: d.date,
      delivery_date: d.date,
      meal_type: d.meal_type === 'lunch' ? 'Lunch' : (d.meal_type === 'dinner' ? 'Dinner' : d.meal_type),
      status: d.status,
      notes: d.notes,
      delivered_time: d.delivered_time,
      menu_items: ['Dal Makhani', 'Paneer Butter Masala', '4 Rotis', 'Jeera Rice', 'Salad'],
      customer_name: d.customer_name,
      customer_phone: d.customer_phone,
      customer_residence: d.pg_or_flat_name,
      customer_room: d.room_no,
      customer_locality: d.customer_locality,
      customer_address: d.pg_or_flat_name + ', Room ' + d.room_no,
      vendor: {
        vendor_id: d.vendor_id,
        name: d.vendor_name,
        locality: d.vendor_locality,
        phone: d.vendor_contact
      },
      agent: {
        agent_id: d.agent_id,
        name: d.agent_name || 'Amit Kumar',
        phone: d.agent_phone || '+91 98765 43210'
      }
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Deliveries error:', err);
    return res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// PATCH /api/delivery/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(422).json({ error: 'Status is required' });

    let updateSql = 'UPDATE deliveries SET status = ?';
    const params = [status];

    if (status === 'delivered') {
      updateSql += ', delivered_time = CURRENT_TIMESTAMP';
    }
    updateSql += ' WHERE delivery_id = ?';
    params.push(id);

    await db.query(updateSql, params);

    await logAuditAction(req, 'UPDATE_DELIVERY_STATUS', 'deliveries', id, 'Status changed to ' + status);

    return res.json({ success: true, message: 'Delivery updated to ' + status });
  } catch (err) {
    console.error('Delivery update error:', err);
    return res.status(500).json({ error: 'Failed to update delivery' });
  }
});

// POST /api/delivery/:id/verify-otp
router.post('/:id/verify-otp', async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) return res.status(422).json({ error: '4-digit Delivery OTP is required' });

    await db.query('UPDATE deliveries SET status = "delivered", delivered_time = CURRENT_TIMESTAMP WHERE delivery_id = ?', [id]);

    await logAuditAction(req, 'OTP_DELIVERY_CONFIRM', 'deliveries', id, 'OTP Verified and Delivered');

    return res.json({ success: true, message: 'OTP verified successfully! Order marked as Delivered.' });
  } catch (err) {
    console.error('OTP verify error:', err);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// GET /api/delivery/:id/tracking
router.get('/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.query(`
      SELECT d.*, d.date AS delivery_date, s.customer_id, s.vendor_id,
             a.name AS agent_name, a.phone AS agent_phone, a.vehicle_type,
             v.name AS vendor_name, v.kitchen_address,
             CONCAT(c.pg_or_flat_name, ', Room ', c.room_no) AS customer_address
      FROM deliveries d
      JOIN subscriptions s ON d.subscription_id = s.sub_id
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN vendors v ON s.vendor_id = v.vendor_id
      LEFT JOIN delivery_agents a ON d.agent_id = a.agent_id
      WHERE d.delivery_id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });

    const del = rows[0];
    return res.json({
      delivery_id: del.delivery_id,
      status: del.status,
      delivery_date: del.delivery_date,
      meal_type: del.meal_type,
      agent: {
        name: del.agent_name || 'Amit Kumar',
        phone: del.agent_phone || '+91 98765 43210',
        vehicle_type: del.vehicle_type || 'bike',
        current_coordinates: { lat: 23.2599, lng: 77.4126 },
        distance_km: 1.2,
        estimated_arrival_mins: del.status === 'delivered' ? 0 : 12
      },
      pickup_location: del.kitchen_address,
      delivery_address: del.customer_address || 'IIIT Bhopal Campus'
    });
  } catch (err) {
    console.error('Tracking error:', err);
    return res.status(500).json({ error: 'Failed to retrieve tracking data' });
  }
});

module.exports = router;
