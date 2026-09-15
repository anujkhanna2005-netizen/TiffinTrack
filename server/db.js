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

// Helper: Run parameterized query
async function query(sql, params = []) {
  try {
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
