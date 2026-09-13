// ============================================================
// TiffinTrack - Service Layer
// public/js/service.js
//
// All API communication goes through this file.
// The UI never imports mockData.js or manipulates data directly.
// When MySQL is added, only this file (and the server routes) change.
// ============================================================

const API_BASE = '/api';

// Helper: fetch with error handling
async function apiFetch(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    // Throw the server error message so the UI can display it
    throw new Error(data.error || 'Server error');
  }
  return data;
}

// ---- VENDORS -----------------------------------------------
async function getVendors() {
  return apiFetch('/vendors');
}

async function getVendorById(id) {
  return apiFetch('/vendors/' + id);
}

// ---- CUSTOMER ----------------------------------------------
async function getCustomer() {
  return apiFetch('/customer');
}

// ---- SUBSCRIPTION ------------------------------------------
async function getSubscription() {
  return apiFetch('/subscription');
}

async function createSubscription(plan_id, vendor_id) {
  return apiFetch('/subscription', {
    method: 'POST',
    body: JSON.stringify({ plan_id, vendor_id })
  });
}

async function cancelSubscription() {
  return apiFetch('/subscription', { method: 'DELETE' });
}

// ---- RATINGS -----------------------------------------------
async function submitRating(vendor_id, taste_score, hygiene_score, punctuality_score, value_score, review) {
  return apiFetch('/rating', {
    method: 'POST',
    body: JSON.stringify({ vendor_id, taste_score, hygiene_score, punctuality_score, value_score, review })
  });
}

// ---- COMPLAINTS --------------------------------------------
async function submitComplaint(vendor_id, issue_type, description) {
  return apiFetch('/complaint', {
    method: 'POST',
    body: JSON.stringify({ vendor_id, issue_type, description })
  });
}

async function getMyComplaints() {
  return apiFetch('/complaints');
}

// ---- DELIVERIES --------------------------------------------
async function getDeliveries(role) {
  // role = 'student' | 'agent' | 'vendor'
  return apiFetch('/deliveries?role=' + (role || 'student'));
}

async function updateDeliveryStatus(delivery_id, status) {
  return apiFetch('/delivery/' + delivery_id, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

// ---- ADMIN -------------------------------------------------
async function getAdminData() {
  return apiFetch('/admin');
}

// ---- VENDOR (dashboard) ------------------------------------
async function getVendorData() {
  return apiFetch('/vendor');
}

async function getVendorMenu(vendor_id) {
  return apiFetch('/vendor/' + vendor_id + '/menu');
}

async function getVendorMealPlans(vendor_id) {
  return apiFetch('/vendor/' + vendor_id + '/meal-plans');
}

async function addMenuItem(vendor_id, name, category, quantity) {
  return apiFetch('/vendor/' + vendor_id + '/menu', {
    method: 'POST',
    body: JSON.stringify({ name, category, quantity })
  });
}

async function editMenuItem(vendor_id, item_id, updates) {
  return apiFetch('/vendor/' + vendor_id + '/menu/' + item_id, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

async function deleteMenuItem(vendor_id, item_id) {
  return apiFetch('/vendor/' + vendor_id + '/menu/' + item_id, {
    method: 'DELETE'
  });
}

async function publishMenu(vendor_id) {
  return apiFetch('/vendor/' + vendor_id + '/menu/publish', {
    method: 'PATCH'
  });
}

async function getVendorRatings() {
  return apiFetch('/ratings');
}
