// ============================================================
// TiffinTrack - API Routes
// server/routes/api.js
//
// All business logic and route handlers live here.
// mockData.js is the only place data is read/written.
// ============================================================

const express = require('express');
const router  = express.Router();
const db      = require('../data/mockData');

// ---- DEMO ROLE ACCOUNTS ------------------------------------
// The demo student is always Rahul Sharma (C001)
// The demo vendor is always Annapurna (V001)
// The demo agent is always Amit Kumar (A001)
const DEMO_CUSTOMER_ID = 'C001';
const DEMO_VENDOR_ID   = 'V001';
const DEMO_AGENT_ID    = 'A001';

// ============================================================
// VENDORS
// ============================================================

// GET /api/vendors — list all vendors with computed stats
router.get('/vendors', (req, res) => {
  const result = db.vendors.map(v => ({
    ...v,
    overall_rating:     db.calcVendorRating(v.vendor_id),
    active_subscribers: db.countActiveSubscribers(v.vendor_id),
    min_price: Math.min(...db.meal_plans.filter(mp => mp.vendor_id === v.vendor_id).map(mp => mp.price))
  }));
  res.json(result);
});

// GET /api/vendors/:id — single vendor with full details
router.get('/vendors/:id', (req, res) => {
  const vendor = db.vendors.find(v => v.vendor_id === req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  // Calculate rating breakdown
  const vendorRatings = db.ratings.filter(r => r.vendor_id === req.params.id);
  let ratingBreakdown = null;
  if (vendorRatings.length > 0) {
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    ratingBreakdown = {
      taste:       Math.round(avg(vendorRatings.map(r => r.taste_score)) * 10) / 10,
      hygiene:     Math.round(avg(vendorRatings.map(r => r.hygiene_score)) * 10) / 10,
      punctuality: Math.round(avg(vendorRatings.map(r => r.punctuality_score)) * 10) / 10,
      value:       Math.round(avg(vendorRatings.map(r => r.value_score)) * 10) / 10,
      count:       vendorRatings.length
    };
  }

  const plans = db.meal_plans.filter(mp => mp.vendor_id === req.params.id);
  const menu  = db.todays_menu[req.params.id] || { items: [], published: false };

  res.json({
    ...vendor,
    overall_rating:     db.calcVendorRating(req.params.id),
    active_subscribers: db.countActiveSubscribers(req.params.id),
    rating_breakdown:   ratingBreakdown,
    meal_plans:         plans,
    todays_menu:        menu,
    recent_ratings:     vendorRatings.slice(-5).reverse()
  });
});

// ============================================================
// CUSTOMER (demo student)
// ============================================================

// GET /api/customer — returns demo student data
router.get('/customer', (req, res) => {
  const customer = db.customers.find(c => c.customer_id === DEMO_CUSTOMER_ID);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// ============================================================
// SUBSCRIPTION
// ============================================================

// GET /api/subscription — current demo student subscription
router.get('/subscription', (req, res) => {
  const sub = db.subscriptions.find(
    s => s.customer_id === DEMO_CUSTOMER_ID && s.status === 'active'
  );

  if (!sub) return res.json(null);

  // Enrich with plan and vendor info
  const plan   = db.meal_plans.find(mp => mp.plan_id === sub.plan_id);
  const vendor = db.vendors.find(v => v.vendor_id === sub.vendor_id);

  res.json({ ...sub, plan, vendor });
});

// POST /api/subscription — subscribe demo student to a plan
// Body: { plan_id, vendor_id }
router.post('/subscription', (req, res) => {
  const { plan_id, vendor_id } = req.body;

  // --- SAFETY CHECK: prevent duplicate active subscription ---
  const existing = db.subscriptions.find(
    s => s.customer_id === DEMO_CUSTOMER_ID && s.status === 'active'
  );
  if (existing) {
    return res.status(409).json({ error: 'Cancel current plan first' });
  }

  // Validate plan exists
  const plan = db.meal_plans.find(mp => mp.plan_id === plan_id && mp.vendor_id === vendor_id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  // Check wallet
  const customer = db.customers.find(c => c.customer_id === DEMO_CUSTOMER_ID);
  if (customer.wallet < plan.price) {
    return res.status(400).json({ error: 'Insufficient wallet balance' });
  }

  // --- TRANSACTION SIMULATION ---
  // Step 1: Create subscription
  const today    = new Date();
  const endDate  = new Date(today);
  endDate.setMonth(endDate.getMonth() + 1);

  const newSub = {
    sub_id:      db.getNextSubId(),
    customer_id: DEMO_CUSTOMER_ID,
    plan_id,
    vendor_id,
    start_date:  today.toISOString().split('T')[0],
    end_date:    endDate.toISOString().split('T')[0],
    status:      'active',
    auto_renew:  false,
    payment_id:  null
  };

  // Step 2: Deduct wallet
  customer.wallet -= plan.price;

  // Step 3: Create payment record
  const newPayment = {
    payment_id:   db.getNextPaymentId(),
    customer_id:  DEMO_CUSTOMER_ID,
    sub_id:       newSub.sub_id,
    amount:       plan.price,
    payment_date: today.toISOString().split('T')[0],
    status:       'success'
  };
  newSub.payment_id = newPayment.payment_id;

  // Step 4: Commit (push to in-memory arrays)
  db.subscriptions.push(newSub);
  db.payments.push(newPayment);

  // Create a delivery record for today
  const newDelivery = {
    delivery_id:   'D' + String(db.deliveries.length + 1).padStart(3, '0'),
    sub_id:        newSub.sub_id,
    customer_id:   DEMO_CUSTOMER_ID,
    vendor_id,
    agent_id:      'A001',
    delivery_date: today.toISOString().split('T')[0],
    meal_type:     'Lunch',
    status:        'pending'
  };
  db.deliveries.push(newDelivery);

  const vendor = db.vendors.find(v => v.vendor_id === vendor_id);
  res.status(201).json({ subscription: newSub, plan, vendor, wallet: customer.wallet });
});

// DELETE /api/subscription — cancel demo student subscription
router.delete('/subscription', (req, res) => {
  const sub = db.subscriptions.find(
    s => s.customer_id === DEMO_CUSTOMER_ID && s.status === 'active'
  );
  if (!sub) return res.status(404).json({ error: 'No active subscription found' });

  sub.status = 'cancelled';
  res.json({ message: 'Subscription cancelled', subscription: sub });
});

// ============================================================
// RATINGS
// ============================================================

// POST /api/rating — submit a rating for current vendor
// Body: { vendor_id, taste_score, hygiene_score, punctuality_score, value_score, review }
router.post('/rating', (req, res) => {
  const { vendor_id, taste_score, hygiene_score, punctuality_score, value_score, review } = req.body;

  // Validate scores
  const scores = [taste_score, hygiene_score, punctuality_score, value_score];
  if (scores.some(s => s < 1 || s > 5)) {
    return res.status(400).json({ error: 'Scores must be between 1 and 5' });
  }

  const vendor = db.vendors.find(v => v.vendor_id === vendor_id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const newRating = {
    rating_id:         db.getNextRatingId(),
    customer_id:       DEMO_CUSTOMER_ID,
    vendor_id,
    taste_score,
    hygiene_score,
    punctuality_score,
    value_score,
    review:            review || '',
    created_at:        new Date().toISOString().split('T')[0]
  };

  db.ratings.push(newRating);

  // Return updated vendor rating
  const updated_rating = db.calcVendorRating(vendor_id);
  res.status(201).json({ rating: newRating, updated_vendor_rating: updated_rating });
});

// ============================================================
// COMPLAINTS
// ============================================================

// POST /api/complaint — submit a complaint
// Body: { vendor_id, issue_type, description }
router.post('/complaint', (req, res) => {
  const { vendor_id, issue_type, description } = req.body;

  if (!issue_type || !description) {
    return res.status(400).json({ error: 'Issue type and description are required' });
  }

  const vendor = db.vendors.find(v => v.vendor_id === vendor_id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const newComplaint = {
    complaint_id: db.getNextComplaintId(),
    customer_id:  DEMO_CUSTOMER_ID,
    vendor_id,
    issue_type,
    description,
    status:       'pending',
    created_at:   new Date().toISOString().split('T')[0]
  };

  db.complaints.push(newComplaint);
  res.status(201).json({ complaint: newComplaint });
});

// GET /api/complaints — get complaints for demo student
router.get('/complaints', (req, res) => {
  const studentComplaints = db.complaints
    .filter(c => c.customer_id === DEMO_CUSTOMER_ID)
    .map(c => ({
      ...c,
      vendor: db.vendors.find(v => v.vendor_id === c.vendor_id)
    }));
  res.json(studentComplaints);
});

// ============================================================
// DELIVERIES
// ============================================================

// GET /api/deliveries — get deliveries (role-aware)
// ?role=student | ?role=agent | ?role=vendor
router.get('/deliveries', (req, res) => {
  const role = req.query.role || 'student';

  let result = db.deliveries;

  if (role === 'student') {
    result = db.deliveries.filter(d => d.customer_id === DEMO_CUSTOMER_ID);
  } else if (role === 'agent') {
    result = db.deliveries.filter(d => d.agent_id === DEMO_AGENT_ID);
  } else if (role === 'vendor') {
    result = db.deliveries.filter(d => d.vendor_id === DEMO_VENDOR_ID);
  }

  // Enrich with customer info
  const enriched = result.map(d => {
    const customer = db.customers.find(c => c.customer_id === d.customer_id);
    const vendor   = db.vendors.find(v => v.vendor_id === d.vendor_id);
    return { ...d, customer, vendor };
  });

  res.json(enriched);
});

// PATCH /api/delivery/:id — update delivery status
// Body: { status: 'pending' | 'out_for_delivery' | 'delivered' }
router.patch('/delivery/:id', (req, res) => {
  const delivery = db.deliveries.find(d => d.delivery_id === req.params.id);
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

  const { status } = req.body;
  const validStatuses = ['pending', 'out_for_delivery', 'delivered'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  delivery.status = status;
  res.json({ delivery });
});

// ============================================================
// ADMIN DATA
// ============================================================

// GET /api/admin — aggregated platform statistics
router.get('/admin', (req, res) => {
  const activeSubscriptions = db.subscriptions.filter(s => s.status === 'active').length;
  const pendingComplaints   = db.complaints.filter(c => c.status === 'pending').length;
  const todayDeliveries     = db.deliveries.length;

  // Platform average rating
  let platformAvgRating = null;
  if (db.ratings.length > 0) {
    const sum = db.ratings.reduce((acc, r) => {
      return acc + (0.35 * r.taste_score + 0.25 * r.hygiene_score + 0.25 * r.punctuality_score + 0.15 * r.value_score);
    }, 0);
    platformAvgRating = Math.round((sum / db.ratings.length) * 10) / 10;
  }

  // Vendor performance table
  const vendorPerformance = db.vendors.map(v => ({
    vendor_id:          v.vendor_id,
    name:               v.name,
    locality:           v.locality,
    overall_rating:     db.calcVendorRating(v.vendor_id),
    active_subscribers: db.countActiveSubscribers(v.vendor_id),
    pending_complaints: db.countPendingComplaints(v.vendor_id),
    today_deliveries:   db.countTodayDeliveries(v.vendor_id)
  }));

  // Customer activity table
  const customerActivity = db.customers.map(c => {
    const activeSub = db.subscriptions.find(s => s.customer_id === c.customer_id && s.status === 'active');
    const vendor    = activeSub ? db.vendors.find(v => v.vendor_id === activeSub.vendor_id) : null;
    const plan      = activeSub ? db.meal_plans.find(mp => mp.plan_id === activeSub.plan_id) : null;
    return {
      customer_id:  c.customer_id,
      name:         c.name,
      residence:    c.residence,
      vendor_name:  vendor ? vendor.name : 'None',
      plan_name:    plan ? plan.name : 'None',
      sub_status:   activeSub ? activeSub.status : 'none'
    };
  });

  // Complaint overview
  const complaintOverview = db.complaints.map(c => {
    const vendor   = db.vendors.find(v => v.vendor_id === c.vendor_id);
    const customer = db.customers.find(cu => cu.customer_id === c.customer_id);
    return {
      complaint_id: c.complaint_id,
      customer_name:customer ? customer.name : 'Unknown',
      vendor_name:  vendor ? vendor.name : 'Unknown',
      issue_type:   c.issue_type,
      status:       c.status,
      created_at:   c.created_at
    };
  });

  res.json({
    stats: {
      total_students:       db.customers.length,
      total_vendors:        db.vendors.length,
      total_agents:         db.agents.length,
      active_subscriptions: activeSubscriptions,
      today_deliveries:     todayDeliveries,
      pending_complaints:   pendingComplaints,
      platform_avg_rating:  platformAvgRating
    },
    vendor_performance: vendorPerformance,
    customer_activity:  customerActivity,
    complaint_overview: complaintOverview
  });
});

// ============================================================
// VENDOR DASHBOARD (demo vendor = V001)
// ============================================================

// GET /api/vendor — vendor dashboard data
router.get('/vendor', (req, res) => {
  const v = db.vendors.find(v => v.vendor_id === DEMO_VENDOR_ID);
  if (!v) return res.status(404).json({ error: 'Vendor not found' });

  const vendorRatings    = db.ratings.filter(r => r.vendor_id === DEMO_VENDOR_ID);
  const vendorComplaints = db.complaints.filter(c => c.vendor_id === DEMO_VENDOR_ID);
  const vendorSubs       = db.subscriptions.filter(s => s.vendor_id === DEMO_VENDOR_ID && s.status === 'active');
  const vendorDeliveries = db.deliveries.filter(d => d.vendor_id === DEMO_VENDOR_ID);

  // Enrich subscribers with customer info
  const subscribers = vendorSubs.map(s => {
    const customer = db.customers.find(c => c.customer_id === s.customer_id);
    const plan     = db.meal_plans.find(mp => mp.plan_id === s.plan_id);
    return { ...s, customer, plan };
  });

  // Enrich ratings with customer info
  const enrichedRatings = vendorRatings.slice(-5).reverse().map(r => {
    const customer = db.customers.find(c => c.customer_id === r.customer_id);
    return { ...r, customer_name: customer ? customer.name : 'Anonymous' };
  });

  // Enrich complaints with customer info
  const enrichedComplaints = vendorComplaints.map(c => {
    const customer = db.customers.find(cu => cu.customer_id === c.customer_id);
    return { ...c, customer_name: customer ? customer.name : 'Anonymous' };
  });

  // Rating breakdown
  let ratingBreakdown = null;
  if (vendorRatings.length > 0) {
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    ratingBreakdown = {
      taste:       Math.round(avg(vendorRatings.map(r => r.taste_score)) * 10) / 10,
      hygiene:     Math.round(avg(vendorRatings.map(r => r.hygiene_score)) * 10) / 10,
      punctuality: Math.round(avg(vendorRatings.map(r => r.punctuality_score)) * 10) / 10,
      value:       Math.round(avg(vendorRatings.map(r => r.value_score)) * 10) / 10
    };
  }

  res.json({
    vendor: v,
    stats: {
      active_subscribers: vendorSubs.length,
      today_deliveries:   vendorDeliveries.length,
      overall_rating:     db.calcVendorRating(DEMO_VENDOR_ID),
      pending_complaints: db.countPendingComplaints(DEMO_VENDOR_ID),
      rating_count:       vendorRatings.length
    },
    rating_breakdown: ratingBreakdown,
    subscribers,
    deliveries:        vendorDeliveries.map(d => ({
      ...d,
      customer: db.customers.find(c => c.customer_id === d.customer_id)
    })),
    recent_ratings:    enrichedRatings,
    complaints:        enrichedComplaints
  });
});

// GET /api/vendor/:id/meal-plans — meal plans for a vendor
router.get('/vendor/:id/meal-plans', (req, res) => {
  const plans = db.meal_plans.filter(mp => mp.vendor_id === req.params.id);
  res.json(plans);
});

// GET /api/vendor/:id/menu — today's menu for a vendor
router.get('/vendor/:id/menu', (req, res) => {
  const menu = db.todays_menu[req.params.id] || { vendor_id: req.params.id, date: new Date().toISOString().split('T')[0], published: false, items: [] };
  res.json(menu);
});

// POST /api/vendor/:id/menu — add a menu item
// Body: { name, category, quantity }
router.post('/vendor/:id/menu', (req, res) => {
  const { name, category, quantity } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'Name and category are required' });

  if (!db.todays_menu[req.params.id]) {
    db.todays_menu[req.params.id] = {
      vendor_id: req.params.id,
      date: new Date().toISOString().split('T')[0],
      published: false,
      items: []
    };
  }

  const newItem = {
    item_id:  db.getNextMenuItemId(),
    name,
    category,
    quantity: quantity || ''
  };

  db.todays_menu[req.params.id].items.push(newItem);
  res.status(201).json({ item: newItem, menu: db.todays_menu[req.params.id] });
});

// PATCH /api/vendor/:id/menu/publish — publish today's menu
// NOTE: This MUST be defined BEFORE /:itemId or Express will treat 'publish' as an itemId
router.patch('/vendor/:id/menu/publish', (req, res) => {
  const menu = db.todays_menu[req.params.id];
  if (!menu) return res.status(404).json({ error: 'Menu not found' });

  menu.published = true;
  res.json({ message: 'Menu published', menu });
});

// PATCH /api/vendor/:id/menu/:itemId — edit a menu item
router.patch('/vendor/:id/menu/:itemId', (req, res) => {
  const menu = db.todays_menu[req.params.id];
  if (!menu) return res.status(404).json({ error: 'Menu not found' });

  const item = menu.items.find(i => i.item_id === req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });

  if (req.body.name)     item.name = req.body.name;
  if (req.body.category) item.category = req.body.category;
  if (req.body.quantity) item.quantity = req.body.quantity;

  res.json({ item, menu });
});

// DELETE /api/vendor/:id/menu/:itemId — delete a menu item
router.delete('/vendor/:id/menu/:itemId', (req, res) => {
  const menu = db.todays_menu[req.params.id];
  if (!menu) return res.status(404).json({ error: 'Menu not found' });

  const idx = menu.items.findIndex(i => i.item_id === req.params.itemId);
  if (idx === -1) return res.status(404).json({ error: 'Menu item not found' });

  menu.items.splice(idx, 1);
  res.json({ message: 'Item deleted', menu });
});

// GET /api/ratings — get all ratings for demo vendor (for vendor ratings page)
router.get('/ratings', (req, res) => {
  const vendorRatings = db.ratings
    .filter(r => r.vendor_id === DEMO_VENDOR_ID)
    .map(r => {
      const customer = db.customers.find(c => c.customer_id === r.customer_id);
      return { ...r, customer_name: customer ? customer.name : 'Anonymous' };
    });
  res.json(vendorRatings);
});

module.exports = router;
