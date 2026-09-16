// ============================================================
// TiffinTrack - Service Layer (public/js/service.js)
// All API communication goes through this file.
// ============================================================

const API_BASE = '/api';

// Helper: Escape HTML strings to prevent XSS and template literal errors
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatINR(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function subscriptionStatusBadge(status) {
  const map = {
    active:    '<span class="badge badge-active">Active</span>',
    pending:   '<span class="badge" style="background:#fed7aa;color:#c2410c;font-weight:700">Pending Approval</span>',
    cancelled: '<span class="badge badge-cancelled">Cancelled</span>',
    expired:   '<span class="badge badge-expired">Expired</span>',
    paused:    '<span class="badge badge-pending">Paused</span>',
    rejected:  '<span class="badge" style="background:#fee2e2;color:#991b1b">Rejected</span>'
  };
  return map[status] || `<span class="badge">${escapeHtml(status || '—')}</span>`;
}

function deliveryStatusBadge(status) {
  const labels = {
    prepared:         '🍳 Prepared',
    pending:          '🍳 Prepared',
    dispatched:       '🛵 Dispatched',
    out_for_delivery: '🛵 Dispatched',
    delivered:        '✅ Delivered',
    skipped:          '⏸️ Skipped',
    cancelled:        '❌ Cancelled'
  };
  return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
}

if (typeof window !== 'undefined') {
  window.escapeHtml = escapeHtml;
  window.formatDate = formatDate;
  window.formatINR = formatINR;
  window.subscriptionStatusBadge = subscriptionStatusBadge;
  window.deliveryStatusBadge = deliveryStatusBadge;
}

// In-memory session-scoped cache
const _apiCache = new Map();

function clearApiCache() {
  _apiCache.clear();
}

if (typeof window !== 'undefined') {
  window.clearApiCache = clearApiCache;
}

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

// Helper: cached GET fetch with session-bound TTL (bypassed on mutations/role switch)
async function cachedApiFetch(path, ttlMs = 15000) {
  const cached = _apiCache.get(path);
  const now = Date.now();
  if (cached && (now - cached.timestamp < ttlMs)) {
    return JSON.parse(JSON.stringify(cached.data)); // clone to prevent unintended mutations
  }
  const data = await apiFetch(path);
  _apiCache.set(path, { data, timestamp: now });
  return data;
}

// ---- AUTHENTICATION ----------------------------------------
async function authLogin(email, password, demoRole = null) {
  clearApiCache();
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, demoRole })
  });
  clearApiCache();
  return res;
}

async function authSignup(userData) {
  clearApiCache();
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

async function authLogout() {
  clearApiCache();
  const res = await apiFetch('/auth/logout', { method: 'POST' });
  clearApiCache();
  return res;
}

async function getAuthMe() {
  return apiFetch('/auth/me');
}

// ---- VENDORS -----------------------------------------------
async function getVendors() {
  return cachedApiFetch('/vendors', 30000);
}

async function getVendorById(id) {
  return cachedApiFetch('/vendors/' + id, 30000);
}

// ---- CUSTOMER ----------------------------------------------
async function getCustomer() {
  return cachedApiFetch('/customer', 15000);
}

// ---- SUBSCRIPTION ------------------------------------------
async function getSubscription() {
  return cachedApiFetch('/subscription', 15000);
}

async function createSubscription(plan_id, vendor_id) {
  clearApiCache();
  const res = await apiFetch('/subscription', {
    method: 'POST',
    body: JSON.stringify({ plan_id, vendor_id })
  });
  clearApiCache();
  return res;
}

async function cancelSubscription() {
  clearApiCache();
  const res = await apiFetch('/subscription', { method: 'DELETE' });
  clearApiCache();
  return res;
}

// ---- ADD-ON 1: SKIP MEAL -----------------------------------
async function skipMeal(skip_date, meal_type, reason) {
  clearApiCache();
  const res = await apiFetch('/subscription/skip', {
    method: 'POST',
    body: JSON.stringify({ skip_date, meal_type, reason })
  });
  clearApiCache();
  return res;
}

async function getSkipHistory() {
  return cachedApiFetch('/subscription/skips', 15000);
}

// ---- ADD-ON 2: MENU VOTING ---------------------------------
async function getMenuVoteOptions() {
  return cachedApiFetch('/menu/vote-options', 30000);
}

async function submitMenuVote(dish_option, vendor_id) {
  clearApiCache();
  const res = await apiFetch('/menu/vote', {
    method: 'POST',
    body: JSON.stringify({ dish_option, vendor_id })
  });
  clearApiCache();
  return res;
}

// ---- ADD-ON 3: GROUP SUBSCRIPTIONS -------------------------
async function createGroupSubscription(group_name, residence_name) {
  clearApiCache();
  const res = await apiFetch('/groups/create', {
    method: 'POST',
    body: JSON.stringify({ group_name, residence_name })
  });
  clearApiCache();
  return res;
}

async function joinGroupSubscription(group_code) {
  clearApiCache();
  const res = await apiFetch('/groups/join', {
    method: 'POST',
    body: JSON.stringify({ group_code })
  });
  clearApiCache();
  return res;
}

// ---- ADD-ON 4: MEAL CUSTOMIZATION -------------------------
async function updateMealPreferences(prefs) {
  clearApiCache();
  const res = await apiFetch('/subscription/preferences', {
    method: 'PUT',
    body: JSON.stringify(prefs)
  });
  clearApiCache();
  return res;
}

// ---- ADD-ON 5: VENDOR SWITCHING ----------------------------
async function switchVendor(target_vendor_id, target_plan_id, reason) {
  clearApiCache();
  const res = await apiFetch('/subscription/switch-vendor', {
    method: 'POST',
    body: JSON.stringify({ target_vendor_id, target_plan_id, reason })
  });
  clearApiCache();
  return res;
}

// ---- ADD-ON 6: OTP & TRACKING ------------------------------
async function verifyDeliveryOtp(delivery_id, otp) {
  clearApiCache();
  const res = await apiFetch('/delivery/' + delivery_id + '/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ otp })
  });
  clearApiCache();
  return res;
}

async function getDeliveryTracking(delivery_id) {
  return cachedApiFetch('/delivery/' + delivery_id + '/tracking', 5000);
}

// ---- RATINGS -----------------------------------------------
async function submitRating(vendor_id, taste_score, hygiene_score, punctuality_score, value_score, review) {
  clearApiCache();
  const res = await apiFetch('/rating', {
    method: 'POST',
    body: JSON.stringify({ vendor_id, taste_score, hygiene_score, punctuality_score, value_score, review })
  });
  clearApiCache();
  return res;
}

async function getVendorRatings(vendor_id) {
  return cachedApiFetch('/ratings' + (vendor_id ? '?vendor_id=' + vendor_id : ''), 15000);
}

// ---- COMPLAINTS --------------------------------------------
async function submitComplaint(vendor_id, issue_type, description) {
  clearApiCache();
  const res = await apiFetch('/complaint', {
    method: 'POST',
    body: JSON.stringify({ vendor_id, issue_type, description })
  });
  clearApiCache();
  return res;
}

async function getMyComplaints(role) {
  return cachedApiFetch('/complaints' + (role ? '?role=' + role : ''), 15000);
}

// ---- DELIVERIES --------------------------------------------
async function getDeliveries(role) {
  return cachedApiFetch('/deliveries?role=' + (role || 'student'), 15000);
}

async function updateDeliveryStatus(delivery_id, status) {
  clearApiCache();
  const res = await apiFetch('/delivery/' + delivery_id, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  clearApiCache();
  return res;
}

// ---- VENDOR DASHBOARD & MENU MANAGEMENT --------------------
async function getVendorData() {
  return cachedApiFetch('/vendor', 15000);
}

async function getVendorMenu(vendor_id) {
  const path = vendor_id ? '/vendor/' + vendor_id + '/menu' : '/vendor/menu';
  return cachedApiFetch(path, 15000);
}

async function getVendorMealPlans(vendor_id) {
  const path = vendor_id ? '/vendor/' + vendor_id + '/meal-plans' : '/vendor/meal-plans';
  return cachedApiFetch(path, 15000);
}

async function createVendorMealPlan(planData, vendor_id) {
  clearApiCache();
  const path = vendor_id ? '/vendor/' + vendor_id + '/meal-plans' : '/vendor/meal-plans';
  const res = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(planData)
  });
  clearApiCache();
  return res;
}

async function deleteVendorMealPlan(plan_id, vendor_id) {
  clearApiCache();
  const path = vendor_id ? '/vendor/' + vendor_id + '/meal-plans/' + plan_id : '/vendor/meal-plans/' + plan_id;
  const res = await apiFetch(path, {
    method: 'DELETE'
  });
  clearApiCache();
  return res;
}

async function addMenuItem(vendor_id, name, category, quantity) {
  clearApiCache();
  const path = vendor_id ? '/vendor/' + vendor_id + '/menu' : '/vendor/menu';
  const res = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify({ name, category, quantity })
  });
  clearApiCache();
  return res;
}

async function deleteMenuItem(vendor_id, item_id) {
  clearApiCache();
  const path = vendor_id ? '/vendor/' + vendor_id + '/menu/' + item_id : '/vendor/menu/' + item_id;
  const res = await apiFetch(path, {
    method: 'DELETE'
  });
  clearApiCache();
  return res;
}

async function publishMenu(vendor_id) {
  clearApiCache();
  const path = vendor_id ? '/vendor/' + vendor_id + '/menu/publish' : '/vendor/menu/publish';
  const res = await apiFetch(path, {
    method: 'PATCH'
  });
  clearApiCache();
  return res;
}

// ---- ADMIN CONTROL SUITE -----------------------------------
async function getAdminData() {
  return cachedApiFetch('/admin', 15000);
}

async function getAdminUsers() {
  return cachedApiFetch('/admin/users', 15000);
}

async function approveUser(user_id) {
  clearApiCache();
  const res = await apiFetch('/admin/users/' + user_id + '/approve', {
    method: 'PATCH'
  });
  clearApiCache();
  return res;
}

async function updateUserStatus(user_id, status) {
  clearApiCache();
  const res = await apiFetch('/admin/users/' + user_id + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  clearApiCache();
  return res;
}

async function updateVendorStatus(vendor_id, status) {
  clearApiCache();
  const res = await apiFetch('/admin/vendors/' + vendor_id + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  clearApiCache();
  return res;
}

async function deleteVendor(vendor_id) {
  clearApiCache();
  const res = await apiFetch('/admin/vendors/' + vendor_id, {
    method: 'DELETE'
  });
  clearApiCache();
  return res;
}

async function deleteUser(user_id) {
  clearApiCache();
  const res = await apiFetch('/admin/users/' + user_id, {
    method: 'DELETE'
  });
  clearApiCache();
  return res;
}

async function resolveComplaint(complaint_id, resolution_notes) {
  clearApiCache();
  const res = await apiFetch('/admin/complaints/' + complaint_id + '/resolve', {
    method: 'PATCH',
    body: JSON.stringify({ resolution_notes })
  });
  clearApiCache();
  return res;
}

async function rejectComplaint(complaint_id, reason) {
  clearApiCache();
  const res = await apiFetch('/admin/complaints/' + complaint_id + '/reject', {
    method: 'PATCH',
    body: JSON.stringify({ reason })
  });
  clearApiCache();
  return res;
}

async function getAdminSubscriptions() {
  return cachedApiFetch('/admin/subscriptions', 15000);
}

async function adminApproveSubscription(sub_id) {
  clearApiCache();
  const res = await apiFetch('/admin/subscription/' + sub_id + '/approve', {
    method: 'PATCH'
  });
  clearApiCache();
  return res;
}

async function adminRejectSubscription(sub_id) {
  clearApiCache();
  const res = await apiFetch('/admin/subscription/' + sub_id + '/reject', {
    method: 'PATCH'
  });
  clearApiCache();
  return res;
}

async function adminPurgeDummyData() {
  clearApiCache();
  const res = await apiFetch('/admin/purge-dummy-data', {
    method: 'POST'
  });
  clearApiCache();
  return res;
}

async function getAdminAuditLogs() {
  return cachedApiFetch('/admin/audit-logs', 15000);
}

// ---- DBMS VIVA SHOWCASE ------------------------------------
async function getDbmsIndexes() {
  return cachedApiFetch('/dbms/indexes', 60000);
}

async function getDbmsViews() {
  return cachedApiFetch('/dbms/views', 60000);
}

async function getDbmsTriggers() {
  return cachedApiFetch('/dbms/triggers', 60000);
}

async function getDbmsTransactions() {
  return cachedApiFetch('/dbms/transactions', 60000);
}
