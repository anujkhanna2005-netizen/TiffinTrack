// ============================================================
// TiffinTrack - Express Server
// server/server.js
// ============================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const apiRoutes = require('./routes/api');

const app  = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// All API routes under /api
app.use('/api', apiRoutes);

// Fallback: serve index.html for any non-API route
// (supports browser refresh on any page)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
});

// Start the server (only if run directly, e.g. node server/server.js)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('===========================================');
    console.log('  TiffinTrack Preview V1 — Server Started');
    console.log('===========================================');
    console.log(`  URL:   http://localhost:${PORT}`);
    console.log(`  Stack: Vanilla HTML + CSS + JS + Express`);
    console.log(`  Mode:  Mock Data (No MySQL)`);
    console.log('===========================================');
  });
}

// Export app for Vercel / serverless deployments & testing
module.exports = app;
