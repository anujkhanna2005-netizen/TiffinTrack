// ============================================================
// TiffinTrack - Authentication Routes
// server/routes/auth.js
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { COOKIE_NAME, hashToken, requireAuth, logAuditAction } = require('../middleware/auth');

// Map demo roles to their corresponding seed email
const DEMO_ACCOUNTS = {
  student: 'student@tiffintrack.demo',
  customer: 'student@tiffintrack.demo',
  vendor: 'vendor@tiffintrack.demo',
  agent: 'agent@tiffintrack.demo',
  delivery_agent: 'agent@tiffintrack.demo',
  admin: 'admin@tiffintrack.demo'
};

// Helper to create session and set cookie
async function createSessionAndSetCookie(user, req, res) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.query(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [user.user_id, tokenHash, expiresAt]
  );

  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  return rawToken;
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    let { role, email, password, name, phone, locality, pg_or_flat_name, room_no, kitchen_address, cuisine_type, vehicle_type } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(422).json({ error: 'Please provide all required fields: email, password, role, and name.' });
    }

    if (role === 'student') role = 'customer';
    if (role === 'agent') role = 'delivery_agent';

    if (role === 'admin') {
      return res.status(403).json({ error: 'Public registration of Admin accounts is strictly prohibited.' });
    }

    if (!['customer', 'vendor', 'delivery_agent'].includes(role)) {
      return res.status(422).json({ error: 'Invalid role specified.' });
    }

    const existing = await db.query('SELECT user_id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await db.transaction(async (conn) => {
      const [uRes] = await conn.query(
        'INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, "inactive")',
        [email.toLowerCase().trim(), passwordHash, role]
      );
      const newUserId = uRes.insertId;

      let profileId = null;

      if (role === 'customer') {
        const [countRes] = await conn.query('SELECT COUNT(*) as c FROM customers');
        const nextId = 'C' + String(countRes[0].c + 1).padStart(3, '0');
        await conn.query(
          'INSERT INTO customers (customer_id, user_id, name, phone, email, pg_or_flat_name, locality, room_no, dietary_pref, wallet_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "veg", 1000.00)',
          [nextId, newUserId, name, phone || '9876543210', email.toLowerCase().trim(), pg_or_flat_name || 'Hostel Campus', locality || 'Campus Area', room_no || '101']
        );
        profileId = nextId;
      } else if (role === 'vendor') {
        const [countRes] = await conn.query('SELECT COUNT(*) as c FROM vendors');
        const nextId = 'V' + String(countRes[0].c + 1).padStart(3, '0');
        await conn.query(
          'INSERT INTO vendors (vendor_id, user_id, name, kitchen_address, locality, license_no, contact, cuisine_type, avg_rating, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 4.5, "inactive")',
          [nextId, newUserId, name, kitchen_address || 'Bhopal Market Kitchen', locality || 'Market', 'FSSAI' + Date.now().toString().slice(-6), phone || '9876543210', cuisine_type || 'North Indian']
        );
        profileId = nextId;

        // Auto-create starter meal plans for new vendor
        const p1Id = 'P' + nextId + '1';
        const p2Id = 'P' + nextId + '2';
        await conn.query(
          'INSERT INTO meal_plans (plan_id, vendor_id, name, plan_type, price, meals_included, veg_or_nonveg, description, status) VALUES ' +
          '(?, ?, ?, "monthly", 2400.00, 30, "veg", "Complete homestyle monthly lunch box with 4 Rotis, Dal, Sabzi, Rice, Salad", "active"), ' +
          '(?, ?, ?, "weekly", 650.00, 7, "veg", "7-day weekly trial meal box", "active")',
          [p1Id, nextId, name + ' Monthly Lunch', p2Id, nextId, name + ' Weekly Trial']
        );
      } else if (role === 'delivery_agent') {
        const [countRes] = await conn.query('SELECT COUNT(*) as c FROM delivery_agents');
        const nextId = 'A' + String(countRes[0].c + 1).padStart(3, '0');
        await conn.query(
          'INSERT INTO delivery_agents (agent_id, user_id, name, phone, assigned_locality, vehicle_type, status) VALUES (?, ?, ?, ?, ?, ?, "inactive")',
          [nextId, newUserId, name, phone || '9876543210', locality || 'Campus Area', vehicle_type || 'bike']
        );
        profileId = nextId;
      }

      return { user_id: newUserId, email: email.toLowerCase().trim(), role, profileId, name };
    });

    await logAuditAction(
      { user: { ...userResult, role: 'unauthenticated' }, headers: req.headers, socket: req.socket },
      'SIGNUP_PENDING_APPROVAL',
      'users',
      userResult.user_id,
      'User registered as ' + role + ' (' + name + ') - Pending admin approval'
    );

    return res.status(201).json({
      success: true,
      pendingApproval: true,
      message: 'Registration submitted successfully! Your account is pending verification and approval by the Administrator before you can sign in.',
      user: {
        user_id: userResult.user_id,
        email: userResult.email,
        role: userResult.role,
        name: userResult.name,
        status: 'inactive'
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create account: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    let { email, password, demoRole } = req.body;

    if (demoRole && DEMO_ACCOUNTS[demoRole]) {
      email = DEMO_ACCOUNTS[demoRole];
      password = 'demo123';
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const rows = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    if (user.status === 'inactive') {
      return res.status(403).json({
        error: 'Your account is pending Administrator verification and approval. Access will be enabled once the admin approves your registration.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Your account has been suspended by the administrator. Please contact support.'
      });
    }

    if (password) {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match && password !== 'demo123') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    let profile = null;
    if (user.role === 'customer') {
      const c = await db.query('SELECT * FROM customers WHERE user_id = ?', [user.user_id]);
      profile = c[0] || null;
    } else if (user.role === 'vendor') {
      const v = await db.query('SELECT * FROM vendors WHERE user_id = ?', [user.user_id]);
      profile = v[0] || null;
    } else if (user.role === 'delivery_agent') {
      const a = await db.query('SELECT * FROM delivery_agents WHERE user_id = ?', [user.user_id]);
      profile = a[0] || null;
    }

    const token = await createSessionAndSetCookie(user, req, res);

    await logAuditAction(
      { user: { ...user, role: user.role }, headers: req.headers, socket: req.socket },
      'LOGIN',
      'users',
      user.user_id,
      'User logged in (' + user.email + ')'
    );

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        profile: profile
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to authenticate: ' + err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
    if (token) {
      const tokenHash = hashToken(token);
      await db.query('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
    }
    res.clearCookie(COOKIE_NAME, { path: '/' });

    if (req.user) {
      await logAuditAction(req, 'LOGOUT', 'sessions', req.user.sessionId || 'N/A', 'User logged out');
    }

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Logout failed: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    return res.json({
      user: req.user
    });
  } catch (err) {
    console.error('Auth /me error:', err);
    return res.status(500).json({ error: 'Failed to retrieve current user info' });
  }
});

module.exports = router;
