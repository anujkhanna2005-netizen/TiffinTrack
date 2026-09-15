// ============================================================
// TiffinTrack - Find Tiffin Page
// public/js/pages/findTiffin.js
// Enhanced: search bar, cuisine filter chips, skeleton loading
// ============================================================

// Store all vendors for client-side filtering (UI state only — not authoritative data)
let _allVendors = [];
let _activeFilter = 'All';
let _searchQuery  = '';
let _hasActiveSub = false;

async function renderFindTiffin() {
  showLoading('cards');
  try {
    const [vendors, subscription] = await Promise.all([
      getVendors(),
      getSubscription()
    ]);

    _allVendors   = vendors;
    _hasActiveSub = subscription !== null;

    showContent(`
      <div class="page-header">
        <h1>🔍 Find Tiffin Near You</h1>
        <p>Browse local vendors and subscribe to a meal plan that suits you.</p>
      </div>

      ${_hasActiveSub ? `<div class="alert alert-info" style="margin-bottom:16px">You have an active subscription with <strong>${subscription.vendor.name}</strong>. Cancel it first to switch vendors.</div>` : ''}

      <!-- Search + Filter -->
      <div class="search-bar">
        <div class="search-input-wrap">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input type="text" id="vendor-search" class="form-control" placeholder="Search by name, location, cuisine..." aria-label="Search vendors" oninput="handleVendorSearch(this.value)" />
        </div>
        <div class="filter-chips" role="group" aria-label="Filter by cuisine">
          ${buildFilterChips(vendors)}
        </div>
      </div>

      <!-- Results count -->
      <p id="results-count" style="font-size:0.82rem;color:var(--color-text-muted);margin-bottom:12px">${vendors.length} vendors found</p>

      <!-- Vendor Grid -->
      <div class="vendor-grid" id="vendor-list">
        ${vendors.map(v => renderVendorCard(v, _hasActiveSub)).join('')}
      </div>
    `);
  } catch (err) {
    showError('Failed to load vendors: ' + err.message);
    showToast('Error', 'Could not load vendors. Please try again.', 'error');
  }
}

function buildFilterChips(vendors) {
  const cuisines = ['All', ...new Set(vendors.map(v => v.cuisine))];
  return cuisines.map(c => `
    <button class="chip ${c === 'All' ? 'active' : ''}" onclick="setFilter('${c}')" aria-pressed="${c === 'All'}">${c}</button>
  `).join('');
}

function setFilter(cuisine) {
  _activeFilter = cuisine;
  // Update chip styles
  document.querySelectorAll('.chip').forEach(chip => {
    const isActive = chip.textContent.trim() === cuisine;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-pressed', isActive);
  });
  applyFilters();
}

function handleVendorSearch(query) {
  _searchQuery = query.toLowerCase().trim();
  applyFilters();
}

function applyFilters() {
  let filtered = _allVendors;

  // Apply cuisine filter
  if (_activeFilter !== 'All') {
    filtered = filtered.filter(v => v.cuisine === _activeFilter);
  }

  // Apply search query
  if (_searchQuery) {
    filtered = filtered.filter(v =>
      v.name.toLowerCase().includes(_searchQuery) ||
      v.locality.toLowerCase().includes(_searchQuery) ||
      v.cuisine.toLowerCase().includes(_searchQuery)
    );
  }

  // Update count
  const countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = filtered.length + ' vendor' + (filtered.length !== 1 ? 's' : '') + ' found';

  // Update grid
  const grid = document.getElementById('vendor-list');
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="nr-icon">🔍</div>
        <p>No vendors match your search.</p>
        <button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="setFilter('All'); document.getElementById('vendor-search').value=''; _searchQuery='';">Clear Filters</button>
      </div>
    `;
  } else {
    grid.innerHTML = filtered.map(v => renderVendorCard(v, _hasActiveSub)).join('');
  }
}

function renderVendorCard(vendor, hasActiveSub) {
  const rating = vendor.overall_rating;
  return `
    <div class="vendor-card" id="vendor-card-${vendor.vendor_id}" role="article" aria-label="${vendor.name}">
      <div class="vendor-card-header">
        <div>
          <div class="vendor-name">${vendor.name}</div>
          <div class="vendor-locale">📍 ${vendor.locality}, ${vendor.city}</div>
        </div>
        <div class="vendor-price">From ${formatINR(vendor.min_price)}/mo</div>
      </div>
      <div class="vendor-meta">
        <span>🍽️ ${vendor.cuisine}</span>
        <span>👥 ${vendor.active_subscribers} students</span>
        <span>${rating ? '⭐ ' + rating.toFixed(1) : '⭐ New'}</span>
      </div>
      <div class="vendor-actions">
        <button class="btn btn-outline btn-sm" onclick="navigateTo('vendorDetails', '${vendor.vendor_id}')" id="btn-details-${vendor.vendor_id}">View Details</button>
        <button class="btn btn-primary btn-sm"
          ${hasActiveSub ? 'disabled title="Cancel current plan first"' : ''}
          onclick="openSubscribeModal('${vendor.vendor_id}')"
          id="btn-subscribe-${vendor.vendor_id}"
          aria-label="Subscribe to ${vendor.name}">
          ${hasActiveSub ? '🔒 Subscribed' : '+ Subscribe'}
        </button>
      </div>
    </div>
  `;
}

async function openSubscribeModal(vendorId) {
  try {
    const vendor = await getVendorById(vendorId);
    const plans  = vendor.meal_plans || vendor.plans || [];

    const hasPlans = plans && plans.length > 0;

    const modalHtml = `
      <div class="modal-overlay" id="modal-overlay" onclick="if(event.target===this)closeModal()" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal">
          <button class="modal-close" onclick="closeModal()" aria-label="Close modal">×</button>
          <h3 id="modal-title">Subscribe to ${vendor.name}</h3>
          <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:16px">📍 ${vendor.locality} &nbsp;|&nbsp; 🍽️ ${vendor.cuisine}</p>

          ${hasPlans ? `
            <div class="form-group">
              <label for="plan-select">Choose a Meal Plan</label>
              <select id="plan-select" class="form-control" onchange="updatePlanPreview('${vendorId}')" aria-required="true">
                ${plans.map(p => `<option value="${p.plan_id}" data-price="${p.price}">${p.name} — ${formatINR(p.price)}/mo (${p.veg ? '🟢 Veg' : '🔴 Non-Veg'})</option>`).join('')}
              </select>
            </div>

            <div id="plan-preview" class="card" style="background:#faf7f3;margin:12px 0;padding:14px">
              ${renderPlanPreview(plans[0])}
            </div>

            <div class="modal-actions">
              <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
              <button class="btn btn-primary" onclick="confirmSubscription('${vendorId}')" id="btn-confirm-sub">Confirm Subscription</button>
            </div>
          ` : `
            <div class="alert alert-warning" style="margin:16px 0">
              ⚠️ <strong>No Active Meal Plans</strong><br>
              This vendor has not published any meal plans yet. Please check back soon or choose another vendor.
            </div>
            <div class="modal-actions">
              <button class="btn btn-primary" onclick="closeModal()" style="width:100%">Close</button>
            </div>
          `}
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (hasPlans) {
      setTimeout(() => {
        const sel = document.getElementById('plan-select');
        if (sel) sel.focus();
      }, 100);
    }
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

function renderPlanPreview(plan) {
  if (!plan) return '';
  const today   = new Date();
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 1);
  return `
    <div style="font-size:0.875rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <strong>${plan.name}</strong>
        <strong style="color:var(--color-primary)">${formatINR(plan.price)}/mo</strong>
      </div>
      <p style="color:var(--color-text-muted)">${plan.description}</p>
      <div style="display:flex;gap:16px;margin-top:8px;font-size:0.8rem;color:var(--color-text-muted);flex-wrap:wrap">
        <span>📅 Start: ${formatDate(today.toISOString().split('T')[0])}</span>
        <span>📅 End: ${formatDate(endDate.toISOString().split('T')[0])}</span>
        <span>${plan.veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
        <span>🍽️ ${plan.meals_per_day} meal${plan.meals_per_day > 1 ? 's' : ''}/day</span>
      </div>
    </div>
  `;
}

function updatePlanPreview(vendorId) {
  const select = document.getElementById('plan-select');
  const planId = select.value;
  getVendorMealPlans(vendorId).then(plans => {
    const plan = plans.find(p => p.plan_id === planId);
    if (plan) document.getElementById('plan-preview').innerHTML = renderPlanPreview(plan);
  });
}

async function confirmSubscription(vendorId) {
  const planId = document.getElementById('plan-select').value;
  const btn    = document.getElementById('btn-confirm-sub');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  // Show animated process steps
  const modal = document.querySelector('.modal');
  modal.innerHTML = `
    <h3>Subscription Process</h3>
    <div class="process-steps" id="proc-steps" aria-live="polite">
      <div class="process-step" id="step-1"><span class="step-icon pending" aria-hidden="true">⏳</span> Checking plan availability...</div>
      <div class="process-step" id="step-2"><span class="step-icon pending" aria-hidden="true">⏳</span> Checking wallet balance...</div>
      <div class="process-step" id="step-3"><span class="step-icon pending" aria-hidden="true">⏳</span> Creating subscription...</div>
      <div class="process-step" id="step-4"><span class="step-icon pending" aria-hidden="true">⏳</span> Processing payment...</div>
      <div class="process-step" id="step-5"><span class="step-icon pending" aria-hidden="true">⏳</span> COMMIT</div>
    </div>
    <div id="proc-result" style="margin-top:16px"></div>
  `;

  const delay = ms => new Promise(r => setTimeout(r, ms));
  try {
    await delay(400);  markStep('step-1', 'done', '✓');
    await delay(400);  markStep('step-2', 'done', '✓');
    await delay(400);  markStep('step-3', 'running', '⟳');

    const result = await createSubscription(planId, vendorId);

    markStep('step-3', 'done', '✓');
    await delay(300);  markStep('step-4', 'done', '✓');
    await delay(300);  markStep('step-5', 'done', '✓ COMMIT');

    document.getElementById('proc-result').innerHTML = `
      <div class="alert alert-success" style="margin-top:8px">
        ✅ <strong>Subscription Activated!</strong><br>
        <small>Wallet: ${formatINR(result.wallet)} &nbsp;|&nbsp; Plan: ${result.plan.name}</small>
      </div>
      <button class="btn btn-primary" style="margin-top:12px;width:100%" onclick="closeModal();navigateTo('studentDashboard')">Go to Dashboard</button>
    `;
    showToast('Subscribed!', `${result.plan.name} is now active.`, 'success');
  } catch (err) {
    markStep('step-3', 'failed', '✗');
    document.getElementById('proc-result').innerHTML = `
      <div class="alert alert-error">❌ ${err.message}</div>
      <button class="btn btn-outline" style="margin-top:12px;width:100%" onclick="closeModal()">Close</button>
    `;
    showToast('Subscription Failed', err.message, 'error');
  }
}

function markStep(stepId, state, icon) {
  const step = document.getElementById(stepId);
  if (!step) return;
  const iconEl = step.querySelector('.step-icon');
  iconEl.className = 'step-icon ' + state;
  iconEl.textContent = icon;
  if (state === 'done')    step.style.color = 'var(--color-success)';
  if (state === 'failed')  step.style.color = 'var(--color-danger)';
  if (state === 'running') step.style.color = 'var(--color-info)';
}
