const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dbms/indexes
router.get('/indexes', async (req, res) => {
  try {
    const indexes = await db.query(`
      SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME != 'PRIMARY'
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `);
    return res.json({
      title: 'Active B-Tree Composite Indexes in MySQL 8.0',
      description: 'Used for optimizing high-frequency queries such as locality lookups, active subscriptions, and meal schedules.',
      indexes
    });
  } catch (err) {
    console.error('Indexes query error:', err);
    return res.status(500).json({ error: 'Failed to query index metadata' });
  }
});

// GET /api/dbms/views
router.get('/views', async (req, res) => {
  try {
    const topRated = await db.query('SELECT * FROM top_rated_vendors');
    const complaints = await db.query('SELECT * FROM complaint_trend');
    const performance = await db.query('SELECT * FROM vendor_performance_summary');

    return res.json({
      views: {
        top_rated_vendors: {
          sql: 'CREATE VIEW top_rated_vendors AS SELECT vendor_id, name, locality, cuisine_type, avg_rating FROM vendors WHERE avg_rating >= 4.0 ORDER BY avg_rating DESC;',
          data: topRated
        },
        complaint_trend: {
          sql: 'CREATE VIEW complaint_trend AS SELECT v.vendor_id, v.name AS vendor_name, c.category, COUNT(c.complaint_id) AS total_complaints FROM complaints c JOIN vendors v ON c.vendor_id = v.vendor_id GROUP BY v.vendor_id, c.category;',
          data: complaints
        },
        vendor_performance_summary: {
          sql: 'CREATE VIEW vendor_performance_summary AS SELECT v.vendor_id, v.name, v.avg_rating, COUNT(DISTINCT s.sub_id) AS active_subscribers, COUNT(DISTINCT d.delivery_id) AS total_deliveries, COUNT(DISTINCT c.complaint_id) AS total_complaints FROM vendors v LEFT JOIN subscriptions s ON v.vendor_id = s.vendor_id AND s.status = "active" LEFT JOIN deliveries d ON v.vendor_id = d.vendor_id LEFT JOIN complaints c ON v.vendor_id = c.vendor_id GROUP BY v.vendor_id;',
          data: performance
        }
      }
    });
  } catch (err) {
    console.error('Views query error:', err);
    return res.status(500).json({ error: 'Failed to query database views' });
  }
});

// GET /api/dbms/triggers
router.get('/triggers', async (req, res) => {
  try {
    const triggers = await db.query(`
      SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING, ACTION_STATEMENT
      FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
    `);
    return res.json({
      title: 'Automated Database Triggers',
      purpose: 'Ensures real-time calculation of overall rating averages on vendors table whenever ratings are inserted, updated, or deleted.',
      triggers
    });
  } catch (err) {
    console.error('Triggers query error:', err);
    return res.status(500).json({ error: 'Failed to query triggers' });
  }
});

// GET /api/dbms/transactions
router.get('/transactions', async (req, res) => {
  return res.json({
    title: 'ACID Transaction Implementation in TiffinTrack',
    atomicity: 'Subscription creation, Vendor switching, and Meal skips use connection.beginTransaction() and connection.commit() wrapped in try/catch with connection.rollback().',
    consistency: 'Foreign keys with ON DELETE RESTRICT / CASCADE maintain referential integrity.',
    isolation: 'SELECT ... FOR UPDATE prevents race conditions and oversubscribing during concurrent requests.',
    durability: 'InnoDB redo logging ensures committed data persists on MySQL 8.0 restart.'
  });
});

module.exports = router;
