// ============================================================
// TiffinTrack - Service Layer (public/js/service.js)
// All API communication goes through this file.
// ============================================================

const API_BASE = '/api';

// Helper: fetch with error handling and cookie credentials
async function apiFetch(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Server error');
  }
  return data;
}

// ---- AUTHENTICATION ----------------------------------------
async function authLogin(email, password, demoRole = null) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, demoRole })
  });
}

async function authSignup(userData) {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

async function authLogout() {
  return apiFetch('/auth/logout', { method: 'POST' });
}

async function getAuthMe() {
  return apiFetch('/auth/me');
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

// ---- ADD-ON 1: SKIP MEAL -----------------------------------
async function skipMeal(skip_date, meal_type, reason) {
  return apiFetch('/subscription/skip', {
    method: 'POST',
    body: JSON.stringify({ skip_date, meal_type, reason })
  });
}

async function getSkipHistory() {
  return apiFetch('/subscription/skips');
}

// ---- ADD-ON 2: MENU VOTING ---------------------------------
async function getMenuVoteOptions() {
  return apiFetch('/menu/vote-options');
}

async function submitMenuVote(dish_option, vendor_id) {
  return apiFetch('/menu/vote', {
    method: 'POST',
    body: JSON.stringify({ dish_option, vendor_id })
  });
}

// ---- ADD-ON 3: GROUP SUBSCRIPTIONS -------------------------
async function createGroupSubscription(group_name, residence_name) {
  return apiFetch('/groups/create', {
    method: 'POST',
    body: JSON.stringify({ group_name, residence_name })
  });
}

async function joinGroupSubscription(group_code) {
  return apiFetch('/groups/join', {
    method: 'POST',
    body: JSON.stringify({ group_code })
  });
}

// ---- ADD-ON 4: MEAL CUSTOMIZATION -------------------------
async function updateMealPreferences(prefs) {
  return apiFetch('/subscription/preferences', {
    method: 'PUT',
    body: JSON.stringify(prefs)
  });
}

// ---- ADD-ON 5: VENDOR SWITCHING ----------------------------
async function switchVendor(target_vendor_id, target_plan_id, reason) {
  return apiFetch('/subscription/switch-vendor', {
    method: 'POST',
    body: JSON.stringify({ target_vendor_id, target_plan_id, reason })
  });
}

// ---- ADD-ON 6: OTP & TRACKING ------------------------------
async function verifyDeliveryOtp(delivery_id, otp) {
  return apiFetch('/delivery/' + delivery_id + '/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ otp })
  });
}

async function getDeliveryTracking(delivery_id) {
  return apiFetch('/delivery/' + delivery_id + '/tracking');
}

// ---- RATINGS -----------------------------------------------
async function submitRating(vendor_id, taste_score, hygiene_score, punctuality_score, value_score, review) {
  return apiFetch('/rating', {
    method: 'POST',
    body: JSON.stringify({ vendor_id, taste_score, hygiene_score, punctuality_score, value_score, review })
  });
}

async function getVendorRatings(vendor_id) {
  return apiFetch('/ratings' + (vendor_id ? '?vendor_id=' + vendor_id : ''));
}

// ---- COMPLAINTS --------------------------------------------
async function submitComplaint(vendor_id, issue_type, description) {
  return apiFetch('/complaint', {
    method: 'POST',
    body: JSON.stringify({ vendor_id, issue_type, description })
  });
}

async function getMyComplaints(role) {
  return apiFetch('/complaints' + (role ? '?role=' + role : ''));
}

// ---- DELIVERIES --------------------------------------------
async function getDeliveries(role) {
  return apiFetch('/deliveries?role=' + (role || 'student'));
}

async function updateDeliveryStatus(delivery_id, status) {
  return apiFetch('/delivery/' + delivery_id, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

// ---- VENDOR DASHBOARD & MENU MANAGEMENT --------------------
async function getVendorData() {
  return apiFetch('/vendor');
}

async function getVendorMenu(vendor_id) {
  const path = vendor_id ? '/vendor/' + vendor_id + '/menu' : '/vendor/menu';
  return apiFetch(path);
}

async function getVendorMealPlans(vendor_id) {
  const path = vendor_id ? '/vendor/' + vendor_id + '/meal-plans' : '/vendor/meal-plans';
  return apiFetch(path);
}

async function addMenuItem(vendor_id, name, category, quantity) {
  const path = vendor_id ? '/vendor/' + vendor_id + '/menu' : '/vendor/menu';
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify({ name, category, quantity })
  });
}

async function deleteMenuItem(vendor_id, item_id) {
  const path = vendor_id ? '/vendor/' + vendor_id + '/menu/' + item_id : '/vendor/menu/' + item_id;
  return apiFetch(path, {
    method: 'DELETE'
  });
}

async function publishMenu(vendor_id) {
  const path = vendor_id ? '/vendor/' + vendor_id + '/menu/publish' : '/vendor/menu/publish';
  return apiFetch(path, {
    method: 'PATCH'
  });
}

// ---- ADMIN CONTROL SUITE -----------------------------------
async function getAdminData() {
  return apiFetch('/admin');
}

async function getAdminUsers() {
  return apiFetch('/admin/users');
}

async function approveUser(user_id) {
  return apiFetch('/admin/users/' + user_id + '/approve', {
    method: 'PATCH'
  });
}

async function updateUserStatus(user_id, status) {
  return apiFetch('/admin/users/' + user_id + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

async function updateVendorStatus(vendor_id, status) {
  return apiFetch('/admin/vendors/' + vendor_id + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

async function deleteVendor(vendor_id) {
  return apiFetch('/admin/vendors/' + vendor_id, {
    method: 'DELETE'
  });
}

async function deleteUser(user_id) {
  return apiFetch('/admin/users/' + user_id, {
    method: 'DELETE'
  });
}

async function resolveComplaint(complaint_id, resolution_notes) {
  return apiFetch('/admin/complaints/' + complaint_id + '/resolve', {
    method: 'PATCH',
    body: JSON.stringify({ resolution_notes })
  });
}

async function rejectComplaint(complaint_id, reason) {
  return apiFetch('/admin/complaints/' + complaint_id + '/reject', {
    method: 'PATCH',
    body: JSON.stringify({ reason })
  });
}

async function getAdminAuditLogs() {
  return apiFetch('/admin/audit-logs');
}

// ---- DBMS VIVA SHOWCASE ------------------------------------
async function getDbmsIndexes() {
  return apiFetch('/dbms/indexes');
}

async function getDbmsViews() {
  return apiFetch('/dbms/views');
}

async function getDbmsTriggers() {
  return apiFetch('/dbms/triggers');
}

async function getDbmsTransactions() {
  return apiFetch('/dbms/transactions');
}
