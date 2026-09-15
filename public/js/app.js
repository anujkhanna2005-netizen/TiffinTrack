// ============================================================
// TiffinTrack - App Router & Auth Orchestrator
// public/js/app.js
// ============================================================

let currentRole = null;
let currentUser = null;

// Navigation definitions per role (3 Core Roles: Student, Vendor, Admin)
const navConfig = {
  student: [
    { label: 'Dashboard',       page: 'studentDashboard' },
    { label: 'Find Tiffin',     page: 'findTiffin' },
    { label: 'My Subscription', page: 'mySubscription' },
    { label: "Today's Meal",    page: 'todayMeal' },
    { label: 'Ratings',         page: 'studentRatings' },
    { label: 'Complaints',      page: 'studentComplaints' }
  ],
  vendor: [
    { label: 'Dashboard',       page: 'vendorDashboard' },
    { label: 'Meal Plans',      page: 'vendorMealPlans' },
    { label: "Today's Menu",    page: 'vendorMenu' },
    { label: 'Subscribers',     page: 'vendorSubscribers' },
    { label: 'Deliveries',      page: 'vendorDeliveries' },
    { label: 'Ratings',         page: 'vendorRatings' },
    { label: 'Complaints',      page: 'vendorComplaints' }
  ],
  admin: [
    { label: 'Dashboard',   page: 'adminDashboard' },
    { label: 'Vendors',     page: 'adminVendors' },
    { label: 'Customers',   page: 'adminCustomers' },
    { label: 'Complaints',  page: 'adminComplaints' },
    { label: 'Ratings',     page: 'adminRatings' },
    { label: 'DBMS Demo',   page: 'dbmsDemo' }
  ]
};

// Role display labels
const roleLabels = {
  student: 'Student',
  customer: 'Student',
  vendor:  'Vendor',
  admin:   'Administrator'
};

// Page registry
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
  adminDashboard:    renderAdminDashboard,
  adminVendors:      renderAdminVendors,
  adminCustomers:    renderAdminCustomers,
  adminComplaints:   renderAdminComplaints,
  adminRatings:      renderAdminRatings,
  dbmsDemo:          renderDbmsDemo
};

function navigateTo(pageName, params) {
  document.querySelectorAll('#nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageName);
  });

  if (pages[pageName]) {
    pages[pageName](params);
  } else {
    showContent('<p>Page not found: ' + pageName + '</p>');
  }
}

function showContent(html) {
  const el = document.getElementById('main-content');
  el.innerHTML = html;
  if (el.firstElementChild) el.firstElementChild.classList.add('page-fade');
  closeMobileNav();
}

function showLoading(type) {
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

function showError(msg) {
  showContent('<div class="main-content"><div class="alert alert-error">' + msg + '</div></div>');
}

// ---- AUTH & SESSION MANAGEMENT ------------------------------

function setupAuthenticatedView(role, user) {
  const normRole = role === 'customer' ? 'student' : role;
  currentRole = normRole;
  currentUser = user;

  document.getElementById('navbar').classList.remove('hidden');
  document.getElementById('nav-role-badge').textContent = roleLabels[normRole] || normRole;

  buildNav(normRole);

  const defaultPage = navConfig[normRole] ? navConfig[normRole][0].page : 'studentDashboard';
  navigateTo(defaultPage);
}

function buildNav(role) {
  const nav   = navConfig[role] || [];
  const links = document.getElementById('nav-links');
  links.innerHTML = nav.map(item =>
    `<li><a href="#" data-page="${item.page}" onclick="navigateTo('${item.page}'); return false;">${item.label}</a></li>`
  ).join('');
}

async function handleLogout() {
  currentRole = null;
  currentUser = null;
  try {
    if (typeof authLogout === 'function') {
      await authLogout();
    }
  } catch (e) {}
  document.getElementById('navbar').classList.add('hidden');
  navigateTo('roleSwitcher');
}

// Backward compatibility helper
function selectRole(role) {
  const normRole = role === 'customer' ? 'student' : role;
  setupAuthenticatedView(normRole, { role: normRole });
}

function switchRole() {
  handleLogout();
}

// ---- HELPERS -----------------------------------------------

function renderStars(rating) {
  if (!rating) return '<span class="text-muted">—</span>';
  const full  = Math.floor(rating);
  const empty = 5 - full;
  return '<span class="stars">' + '★'.repeat(full) + '☆'.repeat(empty) + '</span> ' +
         '<span style="font-size:0.85rem;color:var(--color-text-muted)">' + Number(rating).toFixed(1) + '</span>';
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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

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
  const container = document.getElementById('toast-container');
  if (container) {
    container.insertAdjacentHTML('beforeend', html);
    setTimeout(() => dismissToast(id), 4000);
  }
}

function dismissToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('toast-hide');
  setTimeout(() => el.remove(), 260);
}

window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  btn.classList.toggle('visible', window.scrollY > 300);
});

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

// Check existing session on load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await getAuthMe();
    if (data && data.user) {
      setupAuthenticatedView(data.user.role, data.user);
      return;
    }
  } catch (e) {}
  navigateTo('roleSwitcher');
});
