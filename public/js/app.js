// ============================================================
// TiffinTrack - App Router
// public/js/app.js
//
// Controls role selection, navigation, and page routing.
// All state is fetched fresh from the API on each page load.
// ============================================================

// ---- ROLE TRACKING -----------------------------------------
// Stores the currently selected role (null until chosen)
let currentRole = null;

// Navigation definitions per role
const navConfig = {
  student: [
    { label: 'Dashboard',      page: 'studentDashboard' },
    { label: 'Find Tiffin',    page: 'findTiffin' },
    { label: 'My Subscription',page: 'mySubscription' },
    { label: "Today's Meal",   page: 'todayMeal' },
    { label: 'Ratings',        page: 'studentRatings' },
    { label: 'Complaints',     page: 'studentComplaints' }
  ],
  vendor: [
    { label: 'Dashboard',      page: 'vendorDashboard' },
    { label: 'Meal Plans',     page: 'vendorMealPlans' },
    { label: "Today's Menu",   page: 'vendorMenu' },
    { label: 'Subscribers',    page: 'vendorSubscribers' },
    { label: 'Deliveries',     page: 'vendorDeliveries' },
    { label: 'Ratings',        page: 'vendorRatings' },
    { label: 'Complaints',     page: 'vendorComplaints' }
  ],
  agent: [
    { label: 'Dashboard',         page: 'agentDashboard' },
    { label: "Today's Deliveries",page: 'agentDeliveries' },
    { label: 'Delivery History',  page: 'agentHistory' }
  ],
  admin: [
    { label: 'Dashboard',  page: 'adminDashboard' },
    { label: 'Vendors',    page: 'adminVendors' },
    { label: 'Customers',  page: 'adminCustomers' },
    { label: 'Complaints', page: 'adminComplaints' },
    { label: 'Ratings',    page: 'adminRatings' },
    { label: 'DBMS Demo',  page: 'dbmsDemo' }
  ]
};

// Role display labels
const roleLabels = {
  student: 'Student',
  vendor:  'Vendor',
  agent:   'Delivery Agent',
  admin:   'Admin'
};

// ---- PAGE REGISTRY -----------------------------------------
// Maps page name → render function (defined in pages/*.js)
const pages = {
  roleSwitcher:      renderRoleSwitcher,
  studentDashboard:  renderStudentDashboard,
  findTiffin:        renderFindTiffin,
  vendorDetails:     renderVendorDetails,
  mySubscription:    renderMySubscription,
  todayMeal:         renderTodayMeal,
  studentRatings:    renderStudentRatings,
  studentComplaints: renderStudentComplaints,
  vendorDashboard:   renderVendorDashboard,
  vendorMealPlans:   renderVendorMealPlans,
  vendorMenu:        renderVendorMenu,
  vendorSubscribers: renderVendorSubscribers,
  vendorDeliveries:  renderVendorDeliveries,
  vendorRatings:     renderVendorRatings,
  vendorComplaints:  renderVendorComplaints,
  agentDashboard:    renderAgentDashboard,
  agentDeliveries:   renderAgentDeliveries,
  agentHistory:      renderAgentHistory,
  adminDashboard:    renderAdminDashboard,
  adminVendors:      renderAdminVendors,
  adminCustomers:    renderAdminCustomers,
  adminComplaints:   renderAdminComplaints,
  adminRatings:      renderAdminRatings,
  dbmsDemo:          renderDbmsDemo
};

// ---- NAVIGATION --------------------------------------------

// Navigate to a page by name (and optional params)
function navigateTo(pageName, params) {
  // Highlight active nav link
  document.querySelectorAll('#nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageName);
  });

  // Call the page render function
  if (pages[pageName]) {
    pages[pageName](params);
  } else {
    showContent('<p>Page not found: ' + pageName + '</p>');
  }
}

// Show HTML in main content area — with page fade transition
function showContent(html) {
  const el = document.getElementById('main-content');
  el.innerHTML = html;
  // Wrap first child in fade class
  if (el.firstElementChild) el.firstElementChild.classList.add('page-fade');
  // Close mobile nav on page change
  closeMobileNav();
}

// Show a skeleton loading state (looks better than plain text)
function showLoading(type) {
  // type: 'cards' | 'table' | 'default'
  let skeleton = '';
  if (type === 'cards') {
    skeleton = `
      <div>
        <div class="skeleton skeleton-line h-big w-40" style="margin-bottom:20px"></div>
        <div class="skeleton-grid">
          ${[1,2,3].map(() => `
            <div class="skeleton-card">
              <div class="skeleton skeleton-line h-big w-80"></div>
              <div class="skeleton skeleton-line w-60"></div>
              <div class="skeleton skeleton-line w-40" style="margin-top:12px"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (type === 'dashboard') {
    skeleton = `
      <div>
        <div class="skeleton skeleton-line h-big w-40" style="margin-bottom:20px"></div>
        <div class="stat-grid">
          ${[1,2,3,4].map(() => `
            <div class="skeleton-card">
              <div class="skeleton skeleton-line w-60"></div>
              <div class="skeleton skeleton-line h-big w-40" style="margin-top:8px"></div>
            </div>
          `).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
          <div class="skeleton-card" style="height:180px"></div>
          <div class="skeleton-card" style="height:180px"></div>
        </div>
      </div>
    `;
  } else {
    skeleton = `
      <div>
        <div class="skeleton skeleton-line h-big w-40" style="margin-bottom:20px"></div>
        <div class="skeleton-card" style="margin-bottom:16px">
          <div class="skeleton skeleton-line w-80"></div>
          <div class="skeleton skeleton-line w-60"></div>
          <div class="skeleton skeleton-line w-40"></div>
        </div>
        <div class="skeleton-card">
          <div class="skeleton skeleton-line w-80"></div>
          <div class="skeleton skeleton-line w-60"></div>
        </div>
      </div>
    `;
  }
  document.getElementById('main-content').innerHTML = skeleton;
}

// Show an error message
function showError(msg) {
  showContent('<div class="main-content"><div class="alert alert-error">' + msg + '</div></div>');
}

// ---- ROLE SELECTION ----------------------------------------

// Called when user clicks a role button on the switcher screen
function selectRole(role) {
  currentRole = role;

  // Show navbar and demo banner
  document.getElementById('navbar').classList.remove('hidden');
  document.getElementById('demo-banner').classList.remove('hidden');

  // Set role badge
  document.getElementById('nav-role-badge').textContent = roleLabels[role];

  // Build navigation links
  buildNav(role);

  // Navigate to the default dashboard for this role
  const defaultPage = navConfig[role][0].page;
  navigateTo(defaultPage);
}

// Build navigation links for the given role
function buildNav(role) {
  const nav   = navConfig[role] || [];
  const links = document.getElementById('nav-links');
  links.innerHTML = nav.map(item =>
    `<li><a href="#" data-page="${item.page}" onclick="navigateTo('${item.page}'); return false;">${item.label}</a></li>`
  ).join('');
}

// Switch role back to role switcher
function switchRole() {
  currentRole = null;
  document.getElementById('navbar').classList.add('hidden');
  document.getElementById('demo-banner').classList.add('hidden');
  navigateTo('roleSwitcher');
}

// ---- HELPERS -----------------------------------------------

// Render star display (e.g. "★★★★☆")
function renderStars(rating) {
  if (!rating) return '<span class="text-muted">—</span>';
  const full  = Math.floor(rating);
  const empty = 5 - full;
  return '<span class="stars">' + '★'.repeat(full) + '☆'.repeat(empty) + '</span> ' +
         '<span style="font-size:0.85rem;color:var(--color-text-muted)">' + rating.toFixed(1) + '</span>';
}

// Format delivery status to a readable badge
function deliveryStatusBadge(status) {
  const labels = {
    pending:          'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered:        'Delivered'
  };
  return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
}

// Format a date string to readable format
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Format INR
function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

// Close any open modal
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

// ---- TOAST SYSTEM ------------------------------------------
// showToast(title, message, type)
// type: 'success' | 'error' | 'info' | 'warning'
function showToast(title, message, type) {
  type = type || 'info';
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const id    = 'toast-' + Date.now();
  const html  = `
    <div class="toast toast-${type}" id="${id}" role="alert">
      <span class="toast-icon" aria-hidden="true">${icons[type]}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="dismissToast('${id}')" aria-label="Dismiss notification">&times;</button>
    </div>
  `;
  document.getElementById('toast-container').insertAdjacentHTML('beforeend', html);
  // Auto dismiss after 4 seconds
  setTimeout(() => dismissToast(id), 4000);
}

function dismissToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('toast-hide');
  setTimeout(() => el.remove(), 260);
}

// ---- BACK TO TOP -------------------------------------------
window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  btn.classList.toggle('visible', window.scrollY > 300);
});

// ---- MOBILE NAV --------------------------------------------
function toggleMobileNav() {
  const nav = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger-btn');
  const open = nav.classList.toggle('open');
  btn.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open);
}

function closeMobileNav() {
  const nav = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger-btn');
  if (nav) nav.classList.remove('open');
  if (btn) { btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
}

// ---- INIT --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Start at the role switcher
  navigateTo('roleSwitcher');
});
