// ============================================================
// TiffinTrack - Database Connection Layer (server/db.js)
// Serverless-friendly connection pool using mysql2/promise
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

function getPool() {
  if (!pool) {
    const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';
    const sslOption = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' || isRemote
      ? { rejectUnauthorized: false }
      : undefined;

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tiffintrack',
      ssl: sslOption,
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 4,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      dateStrings: true
    });
  }
  return pool;
}

let schemaInitPromise = null;

async function ensureSchema() {
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      try {
        const p = getPool();
        // Check subscriptions columns
        const [subCols] = await p.query(
          "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscriptions'"
        );
        const colNames = new Set((subCols || []).map(c => (c.COLUMN_NAME || c.column_name || '').toLowerCase()));

        if (!colNames.has('locked_price')) {
          try { await p.query("ALTER TABLE subscriptions ADD COLUMN locked_price DECIMAL(10,2) NULL DEFAULT NULL"); } catch (e) {}
        }
        if (!colNames.has('locked_meals_included')) {
          try { await p.query("ALTER TABLE subscriptions ADD COLUMN locked_meals_included INT NULL DEFAULT NULL"); } catch (e) {}
        }
        if (!colNames.has('approved_by')) {
          try { await p.query("ALTER TABLE subscriptions ADD COLUMN approved_by VARCHAR(50) NULL DEFAULT NULL"); } catch (e) {}
        }
        if (!colNames.has('approved_at')) {
          try { await p.query("ALTER TABLE subscriptions ADD COLUMN approved_at DATETIME NULL DEFAULT NULL"); } catch (e) {}
        }
        if (!colNames.has('mode')) {
          try { await p.query("ALTER TABLE subscriptions ADD COLUMN mode VARCHAR(50) NOT NULL DEFAULT 'cash_on_delivery'"); } catch (e) {}
        }

        // Check payments columns
        const [payCols] = await p.query(
          "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments'"
        );
        const payColNames = new Set((payCols || []).map(c => (c.COLUMN_NAME || c.column_name || '').toLowerCase()));

        if (!payColNames.has('amount_due')) {
          try { await p.query("ALTER TABLE payments ADD COLUMN amount_due DECIMAL(10,2) NULL DEFAULT NULL"); } catch (e) {}
        }
        if (!payColNames.has('collected_at')) {
          try { await p.query("ALTER TABLE payments ADD COLUMN collected_at DATETIME NULL DEFAULT NULL"); } catch (e) {}
        }

        // Modify subscriptions status to ensure pending/rejected allowed
        try {
          await p.query("ALTER TABLE subscriptions MODIFY COLUMN status ENUM('pending', 'active', 'cancelled', 'expired', 'paused', 'rejected') NOT NULL DEFAULT 'pending'");
        } catch (e) {}

        // Modify payments status and mode
        try {
          await p.query("ALTER TABLE payments MODIFY COLUMN mode VARCHAR(50) NOT NULL DEFAULT 'cash_on_delivery'");
        } catch (e) {}
        try {
          await p.query("ALTER TABLE payments MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending_cash'");
        } catch (e) {}

        // Populate null locked_price and amount_due
        try {
          await p.query(`
            UPDATE subscriptions s
            JOIN meal_plans p ON s.plan_id = p.plan_id
            SET s.locked_price = p.price,
                s.locked_meals_included = p.meals_included
            WHERE s.locked_price IS NULL
          `);
        } catch (e) {}

        try {
          await p.query("UPDATE payments SET amount_due = amount WHERE amount_due IS NULL");
        } catch (e) {}

        // Ensure indexes
        try { await p.query("CREATE INDEX idx_subs_status ON subscriptions(status)"); } catch (e) {}
        try { await p.query("CREATE INDEX idx_subs_vendor_status ON subscriptions(vendor_id, status)"); } catch (e) {}
        try { await p.query("CREATE INDEX idx_pay_status ON payments(status)"); } catch (e) {}
      } catch (err) {
        console.warn('[DB Auto-Sync Warning]', err.message);
      }
    })();
  }
  return schemaInitPromise;
}

// Helper: Run parameterized query
async function query(sql, params = []) {
  try {
    await ensureSchema();
    const p = getPool();
    const [rows] = await p.query(sql, params);
    return rows;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' && (!process.env.DB_HOST || process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1')) {
      throw new Error('Database connection failed: MySQL is running locally on your machine, but Vercel cloud requires a cloud database host (DB_HOST in Vercel settings).');
    }
    throw err;
  }
}

// Helper: Run transactional operation
async function transaction(callback) {
  await ensureSchema();
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  getPool,
  query,
  transaction
};
