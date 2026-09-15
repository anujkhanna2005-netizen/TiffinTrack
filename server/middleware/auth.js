// ============================================================
// TiffinTrack - Authentication & Authorization Middleware
// server/middleware/auth.js
// ============================================================

const crypto = require('crypto');
const db = require('../db');

const COOKIE_NAME = 'tiffintrack_session';

// SHA-256 hash helper
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Audit logger helper
async function logAuditAction(req, action, entityType, entityId, description, oldValues = null, newValues = null) {
  try {
    const userId = req && req.user ? req.user.user_id : null;
    const userRole = req && req.user ? req.user.role : (req && req.body && req.body.role ? req.body.role : 'guest');
    const ip = (req && req.headers && req.headers['x-forwarded-for']) || (req && req.socket && req.socket.remoteAddress) || '127.0.0.1';
    const userAgent = (req && req.headers && req.headers['user-agent']) || 'unknown';

    await db.query(
      'INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, old_values, new_values, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        userRole,
        action,
        entityType,
        String(entityId || 'N/A'),
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        description || '',
        ip,
        userAgent.substring(0, 255)
      ]
    );
  } catch (err) {
    console.error('Failed to log audit action:', err.message);
  }
}

// Authentication middleware
async function requireAuth(req, res, next) {
  let token = req.cookies ? req.cookies[COOKIE_NAME] : null;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const tokenHash = hashToken(token);

    const rows = await db.query(
      'SELECT s.session_id, s.user_id, s.expires_at, u.email, u.role, u.status AS user_status ' +
      'FROM sessions s JOIN users u ON s.user_id = u.user_id WHERE s.token_hash = ?',
      [tokenHash]
    );

    if (!rows || rows.length === 0) {
      res.clearCookie(COOKIE_NAME);
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    const session = rows[0];

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      await db.query('DELETE FROM sessions WHERE session_id = ?', [session.session_id]);
      res.clearCookie(COOKIE_NAME);
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    // Check active status
    if (session.user_status !== 'active') {
      await db.query('DELETE FROM sessions WHERE session_id = ?', [session.session_id]);
      res.clearCookie(COOKIE_NAME);
      return res.status(403).json({ error: 'Account is ' + session.user_status + '. Access denied.' });
    }

    // Attach role profile
    let profile = null;
    if (session.role === 'customer' || session.role === 'student') {
      const cust = await db.query('SELECT * FROM customers WHERE user_id = ?', [session.user_id]);
      profile = cust[0] || null;
    } else if (session.role === 'vendor') {
      const vend = await db.query('SELECT * FROM vendors WHERE user_id = ?', [session.user_id]);
      profile = vend[0] || null;
    } else if (session.role === 'delivery_agent' || session.role === 'agent') {
      const agnt = await db.query('SELECT * FROM delivery_agents WHERE user_id = ?', [session.user_id]);
      profile = agnt[0] || null;
    }

    req.user = {
      user_id: session.user_id,
      email: session.email,
      role: session.role,
      status: session.user_status,
      sessionId: session.session_id,
      profile: profile
    };

    // Update last_used_at
    db.query('UPDATE sessions SET last_used_at = CURRENT_TIMESTAMP WHERE session_id = ?', [session.session_id]).catch(() => {});

    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    return res.status(500).json({ error: 'Internal server authentication error' });
  }
}

// Role Authorization middleware
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const normalizedUserRole = req.user.role === 'student' ? 'customer' : (req.user.role === 'agent' ? 'delivery_agent' : req.user.role);
    const normalizedAllowed = allowedRoles.map(r => r === 'student' ? 'customer' : (r === 'agent' ? 'delivery_agent' : r));

    if (!normalizedAllowed.includes(normalizedUserRole) && !normalizedAllowed.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden. Role ' + req.user.role + ' is not authorized to access this resource.' 
      });
    }
    next();
  };
}

// Attach user session if token exists (non-blocking for public/hybrid routes)
async function attachUserSession(req, res, next) {
  let token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const tokenHash = hashToken(token);
    const rows = await db.query(
      'SELECT s.session_id, s.user_id, s.expires_at, u.email, u.role, u.status AS user_status ' +
      'FROM sessions s JOIN users u ON s.user_id = u.user_id WHERE s.token_hash = ?',
      [tokenHash]
    );

    if (!rows || rows.length === 0 || new Date(rows[0].expires_at) < new Date() || rows[0].user_status !== 'active') {
      req.user = null;
      return next();
    }

    const session = rows[0];
    let profile = null;
    if (session.role === 'customer' || session.role === 'student') {
      const cust = await db.query('SELECT * FROM customers WHERE user_id = ?', [session.user_id]);
      profile = cust[0] || null;
    } else if (session.role === 'vendor') {
      const vend = await db.query('SELECT * FROM vendors WHERE user_id = ?', [session.user_id]);
      profile = vend[0] || null;
    } else if (session.role === 'delivery_agent' || session.role === 'agent') {
      const agnt = await db.query('SELECT * FROM delivery_agents WHERE user_id = ?', [session.user_id]);
      profile = agnt[0] || null;
    }

    req.user = {
      user_id: session.user_id,
      email: session.email,
      role: session.role,
      status: session.user_status,
      sessionId: session.session_id,
      profile: profile
    };
  } catch (e) {
    req.user = null;
  }
  next();
}

module.exports = {
  COOKIE_NAME,
  hashToken,
  logAuditAction,
  requireAuth,
  attachUserSession,
  requireRole
};
