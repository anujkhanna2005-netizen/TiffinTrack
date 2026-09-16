// ============================================================
// TiffinTrack - Express Server (server/server.js)
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const compression = require('compression');
const { attachUserSession } = require('./middleware/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// HTTP Response Compression (Gzip / Deflate for static assets and API JSON)
app.use(compression());

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Parse cookies for auth sessions
app.use(cookieParser());

// High-speed static asset serving with ETag and cache control
// Placed BEFORE auth middleware so static asset requests do NOT trigger database session lookups
const isProduction = process.env.NODE_ENV === 'production';
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: isProduction ? '1d' : '1h',
  etag: true
}));

// Attach user session strictly to /api endpoints
app.use('/api', attachUserSession);

// All API routes under /api
app.use('/api', apiRoutes);

// Fallback: serve index.html for non-API routes (supports browser refresh)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Start the server (only if run directly)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('===========================================');
    console.log('  TiffinTrack Full-Stack Server Started');
    console.log('===========================================');
    console.log(`  URL:      http://localhost:${PORT}`);
    console.log(`  Database: MySQL 8.0 (tiffintrack)`);
    console.log(`  Auth:     DB-Backed Sessions (HTTP-only)`);
    console.log('===========================================');
  });
}

// Export app for Vercel / serverless deployments & testing
module.exports = app;
