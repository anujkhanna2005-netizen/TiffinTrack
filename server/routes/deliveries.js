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

// GET /api/deliveries
router.get('/', async (req, res) => {
  try {
    const role = req.query.role || (req.user ? req.user.role : 'student');

    let sql = `
      SELECT d.*, d.date AS delivery_date, s.customer_id, s.vendor_id,
             s.bread_preference AS sub_bread, s.spice_level AS sub_spice, s.special_instructions AS sub_instructions,
             c.name AS customer_name, c.pg_or_flat_name, c.room_no, c.locality AS customer_locality, c.phone AS customer_phone,
             c.bread_preference AS cust_bread, c.spice_level AS cust_spice, c.special_instructions AS cust_instructions, c.dietary_pref,
             v.name AS vendor_name, v.locality AS vendor_locality, v.contact AS vendor_contact,
             sk.reason AS skip_reason, sk.refund_amount AS skip_refund_amount
      FROM deliveries d
      JOIN subscriptions s ON d.subscription_id = s.sub_id
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN vendors v ON s.vendor_id = v.vendor_id
      LEFT JOIN skip_requests sk ON (d.subscription_id = sk.subscription_id AND d.date = sk.date)
    `;
    let params = [];

    if (role === 'vendor') {
      const vendor = await getActiveVendor(req);
      sql += ' WHERE s.vendor_id = ? ORDER BY d.date DESC, d.delivery_id DESC';
      params.push(vendor ? vendor.vendor_id : 'V001');
    } else {
      const customer = await getActiveCustomer(req);
      sql += ' WHERE s.customer_id = ? ORDER BY d.date DESC, d.delivery_id DESC';
      params.push(customer ? customer.customer_id : 'C001');
    }

    const rows = await db.query(sql, params);

    // Fetch published daily menus for these deliveries to attach dynamic menu items
    const vendorDates = [...new Set(rows.map(r => `${r.vendor_id}_${r.date}`))];
    const menuMap = {};

    if (rows.length > 0) {
      try {
        const menuRows = await db.query('SELECT vendor_id, date, items FROM daily_menus WHERE published = 1');
        for (const m of menuRows) {
          let parsed = m.items;
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
          }
          if (Array.isArray(parsed)) {
            const itemNames = parsed.map(i => (typeof i === 'string' ? i : (i.name || i.item_name || 'Daily Special')));
            menuMap[`${m.vendor_id}_${m.date}`] = itemNames;
          }
        }
      } catch (menuErr) {
        console.warn('[Deliveries Menu Fetch Notice]', menuErr.message);
      }
    }

    const formatted = rows.map(d => {
      const dynamicMenu = menuMap[`${d.vendor_id}_${d.date}`] || ['Fresh Homestyle Dal', 'Seasonal Sabzi', '4 Phulkas', 'Steamed Rice', 'Salad'];
      const breadPref = d.sub_bread || d.cust_bread || 'standard';
      const spicePref = d.sub_spice || d.cust_spice || 'medium';
      const instructions = (d.sub_instructions || d.cust_instructions || '').slice(0, 200).trim();
      const isSkipped = d.status === 'skipped';
      const skipReason = d.skip_reason || (isSkipped ? d.notes : null);
      const refundAmt = d.skip_refund_amount ? parseFloat(d.skip_refund_amount) : (isSkipped ? 80.0 : null);

      return {
        delivery_id: d.delivery_id,
        subscription_id: d.subscription_id,
        date: d.date,
        delivery_date: d.date,
        meal_type: d.meal_type === 'lunch' ? 'Lunch' : (d.meal_type === 'dinner' ? 'Dinner' : d.meal_type),
        status: d.status,
        is_skipped: isSkipped,
        skip_reason: skipReason,
        refund_amount: refundAmt,
        notes: d.notes,
        delivered_time: d.delivered_time,
        menu_items: dynamicMenu,
        bread_preference: breadPref,
        spice_level: spicePref,
        special_instructions: instructions,
        customer_name: d.customer_name,
        customer_phone: d.customer_phone,
        customer_residence: d.pg_or_flat_name,
        customer_room: d.room_no,
        customer_locality: d.customer_locality,
        customer_address: (d.pg_or_flat_name || 'Campus') + ', Room ' + (d.room_no || '101'),
        vendor: {
          vendor_id: d.vendor_id,
          name: d.vendor_name,
          locality: d.vendor_locality,
          phone: d.vendor_contact
        }
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error('Deliveries error:', err);
    return res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// PATCH /api/delivery/:id (Vendor updates delivery status with ownership check)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(422).json({ error: 'Status is required' });

    const deliveryRows = await db.query(`
      SELECT d.*, s.vendor_id 
      FROM deliveries d 
      JOIN subscriptions s ON d.subscription_id = s.sub_id 
      WHERE d.delivery_id = ?
    `, [id]);

    if (deliveryRows.length === 0) {
      return res.status(404).json({ error: 'Delivery record not found' });
    }

    const delivery = deliveryRows[0];

    // Only vendors and admins can update delivery status
    if (req.user) {
      if (req.user.role === 'customer' || req.user.role === 'student') {
        return res.status(403).json({ error: 'Forbidden: Customers cannot modify delivery status.' });
      }
      if (req.user.role === 'vendor') {
        const activeVendor = await getActiveVendor(req);
        if (activeVendor && delivery.vendor_id !== activeVendor.vendor_id) {
          return res.status(403).json({ error: 'Forbidden: You cannot modify deliveries belonging to another vendor.' });
        }
      }
    }

    let updateSql = 'UPDATE deliveries SET status = ?';
    const params = [status];

    if (status === 'delivered') {
      updateSql += ', delivered_time = CURRENT_TIMESTAMP';
    }
    updateSql += ' WHERE delivery_id = ?';
    params.push(id);

    await db.query(updateSql, params);

    await logAuditAction(req, 'VENDOR_UPDATED_DELIVERY', 'deliveries', id, 'Vendor updated delivery status to ' + status);

    return res.json({ success: true, message: 'Delivery updated to ' + status });
  } catch (err) {
    console.error('Delivery update error:', err);
    return res.status(500).json({ error: 'Failed to update delivery: ' + err.message });
  }
});

module.exports = router;
