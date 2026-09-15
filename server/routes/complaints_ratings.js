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

async function getActiveVendor(req) {
  if (req.user && req.user.role === 'vendor') {
    if (req.user.profile && req.user.profile.vendor_id) return req.user.profile;
    const rows = await db.query('SELECT * FROM vendors WHERE user_id = ?', [req.user.user_id]);
    if (rows.length > 0) return rows[0];
  }
  const defaultVend = await db.query('SELECT * FROM vendors WHERE vendor_id = "V001"');
  return defaultVend[0] || null;
}

// POST /api/rating
router.post('/rating', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Please log in to submit a rating' });

    const { vendor_id, taste_score, hygiene_score, punctuality_score, value_score, review, review_text } = req.body;
    if (!vendor_id) return res.status(422).json({ error: 'Vendor ID is required' });

    const taste = parseInt(taste_score, 10) || 4;
    const hygiene = parseInt(hygiene_score, 10) || 4;
    const punct = parseInt(punctuality_score, 10) || 4;
    const val = parseInt(value_score, 10) || 4;
    const weighted = ((taste * 0.35) + (hygiene * 0.25) + (punct * 0.20) + (val * 0.20)).toFixed(2);

    const activeSub = await db.query('SELECT sub_id FROM subscriptions WHERE customer_id = ? AND vendor_id = ? LIMIT 1', [customer.customer_id, vendor_id]);
    const subId = activeSub.length > 0 ? activeSub[0].sub_id : 'S001';

    const countRes = await db.query('SELECT COUNT(*) as cnt FROM ratings');
    const nextRatingId = 'R' + String(countRes[0].cnt + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);

    await db.query(
      'INSERT INTO ratings (rating_id, customer_id, vendor_id, subscription_id, taste_score, hygiene_score, punctuality_score, value_score, weighted_score, review_text, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active", ?)',
      [nextRatingId, customer.customer_id, vendor_id, subId, taste, hygiene, punct, val, weighted, review || review_text || '', today]
    );

    const updatedVendor = await db.query('SELECT avg_rating FROM vendors WHERE vendor_id = ?', [vendor_id]);
    const newAvg = updatedVendor[0] ? parseFloat(updatedVendor[0].avg_rating) : parseFloat(weighted);

    await logAuditAction(req, 'SUBMIT_RATING', 'ratings', nextRatingId, 'Customer submitted rating for vendor ' + vendor_id);

    return res.status(201).json({
      success: true,
      message: 'Rating submitted successfully! Vendor rating updated via database trigger.',
      rating_id: nextRatingId,
      overall_score: weighted,
      updated_vendor_rating: newAvg,
      vendor_avg_rating: newAvg
    });
  } catch (err) {
    console.error('Rating error:', err);
    return res.status(500).json({ error: 'Failed to submit rating: ' + err.message });
  }
});

// GET /api/ratings
router.get('/ratings', async (req, res) => {
  try {
    const vendor = await getActiveVendor(req);
    const vendor_id = req.query.vendor_id || (vendor ? vendor.vendor_id : 'V001');

    const ratings = await db.query(`
      SELECT r.*, r.weighted_score AS overall_score, r.review_text AS review, c.name AS customer_name, c.locality AS customer_locality
      FROM ratings r
      JOIN customers c ON r.customer_id = c.customer_id
      WHERE r.vendor_id = ?
      ORDER BY r.created_at DESC
    `, [vendor_id]);

    return res.json(ratings);
  } catch (err) {
    console.error('Fetch ratings error:', err);
    return res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// POST /api/complaint
router.post('/complaint', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    if (!customer) return res.status(401).json({ error: 'Please log in to file a complaint' });

    const { vendor_id, issue_type, description } = req.body;
    
    let normalizedType = 'other';
    const typeStr = (issue_type || '').toLowerCase();
    if (typeStr.includes('late') || typeStr.includes('delay')) normalizedType = 'late_delivery';
    else if (typeStr.includes('quality') || typeStr.includes('taste') || typeStr.includes('stale') || typeStr.includes('poor')) normalizedType = 'food_quality';
    else if (typeStr.includes('item') || typeStr.includes('missing')) normalizedType = 'wrong_items';
    else if (typeStr.includes('package') || typeStr.includes('spill')) normalizedType = 'packaging_issue';
    else if (typeStr.includes('behavior') || typeStr.includes('rude')) normalizedType = 'behavior';

    const countRes = await db.query('SELECT COUNT(*) as cnt FROM complaints');
    const compId = 'CMP' + String(countRes[0].cnt + 1).padStart(3, '0');

    await db.query(
      'INSERT INTO complaints (complaint_id, customer_id, vendor_id, issue_type, description, status) VALUES (?, ?, ?, ?, ?, "open")',
      [compId, customer.customer_id, vendor_id || 'V001', normalizedType, description || '']
    );

    await logAuditAction(req, 'FILE_COMPLAINT', 'complaints', compId, 'Complaint filed: ' + normalizedType);

    return res.status(201).json({
      success: true,
      message: 'Complaint filed successfully. Ticket #' + compId,
      complaint_id: compId,
      complaint: {
        complaint_id: compId,
        status: 'pending',
        issue_type: issue_type || 'Food Quality',
        description: description || ''
      }
    });
  } catch (err) {
    console.error('Complaint filing error:', err);
    return res.status(500).json({ error: 'Failed to file complaint' });
  }
});

// GET /api/complaints
router.get('/complaints', async (req, res) => {
  try {
    const customer = await getActiveCustomer(req);
    const vendor = await getActiveVendor(req);

    let sql = `
      SELECT c.*, cust.name AS customer_name, v.name AS vendor_name,
             CASE WHEN c.status = 'open' THEN 'pending' ELSE c.status END AS status
      FROM complaints c
      JOIN customers cust ON c.customer_id = cust.customer_id
      JOIN vendors v ON c.vendor_id = v.vendor_id
    `;
    let params = [];

    if (req.query.role === 'vendor' && vendor) {
      sql += ' WHERE c.vendor_id = ? ORDER BY c.created_at DESC';
      params.push(vendor.vendor_id);
    } else if (customer) {
      sql += ' WHERE c.customer_id = ? ORDER BY c.created_at DESC';
      params.push(customer.customer_id);
    } else {
      sql += ' ORDER BY c.created_at DESC';
    }

    const rows = await db.query(sql, params);
    const formatted = rows.map(r => ({
      ...r,
      vendor: {
        vendor_id: r.vendor_id,
        name: r.vendor_name
      }
    }));
    return res.json(formatted);
  } catch (err) {
    console.error('Fetch complaints error:', err);
    return res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

module.exports = router;
