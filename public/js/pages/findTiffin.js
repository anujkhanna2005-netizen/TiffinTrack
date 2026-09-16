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

// Image helper for vendors
function getVendorImage(vId) {
  const map = {
    'V001': '/images/tiffin_homestyle.png',
    'V002': '/images/thali_special.png',
    'V003': '/images/rajasthani_thali.png',
    'V004': '/images/chole_bhature.png',
    'V005': '/images/high_protein_bowl.png'
  };
  return map[vId] || '/images/fresh_phulkas.png';
}

async function renderFindTiffin() {
  showLoading('cards');
  try {
    const [vendors, subscription] = await Promise.all([
      getVendors(),
      getSubscription()
    ]);

    _allVendors   = vendors;
    _hasActiveSub = subscription !== null && subscription.status === 'active';

    showContent(`
      <div class="max-w-6xl mx-auto py-2 flex flex-col gap-6">
        
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span class="material-symbols-outlined text-[14px]">storefront</span>
              Campus Tiffin Marketplace
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Find & Subscribe to Local Kitchens
            </h1>
            <p class="text-slate-500 text-sm mt-1 max-w-xl">
              Compare hygienic home-style tiffin services around your campus, view authentic daily menus, and subscribe with Cash on Delivery.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500 bg-slate-100 px-3.5 py-2 rounded-xl" id="results-count">
              ${vendors.length} kitchens available
            </span>
          </div>
        </div>

        ${_hasActiveSub ? `
          <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-blue-900 shadow-sm">
            <span class="material-symbols-outlined text-blue-600 text-[20px]">info</span>
            <div>
              You are currently subscribed to <strong>${subscription.vendor.name}</strong>. You can switch vendors anytime via the <strong>One-Click Vendor Switch</strong> on your subscription page.
            </div>
          </div>
        ` : ''}

        <!-- Search & Filter Controls -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div class="relative w-full md:w-96">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input type="text" id="vendor-search" class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="Search by name, locality, cuisine..." aria-label="Search vendors" oninput="handleVendorSearch(this.value)" />
          </div>

          <div class="flex flex-wrap items-center gap-2 w-full md:w-auto" role="group" aria-label="Filter by cuisine">
            ${buildFilterChips(vendors)}
          </div>
        </div>

        <!-- Vendor Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="vendor-list">
          ${vendors.map(v => renderVendorCard(v, _hasActiveSub)).join('')}
        </div>

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
    <button class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${c === 'All' ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'} chip" 
      onclick="setFilter('${c}')" aria-pressed="${c === 'All'}">${c}</button>
  `).join('');
}

function setFilter(cuisine) {
  _activeFilter = cuisine;
  document.querySelectorAll('.chip').forEach(chip => {
    const isActive = chip.textContent.trim() === cuisine;
    if (isActive) {
      chip.className = 'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border bg-emerald-700 text-white border-emerald-700 shadow-sm chip';
    } else {
      chip.className = 'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 chip';
    }
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

  if (_activeFilter !== 'All') {
    filtered = filtered.filter(v => v.cuisine === _activeFilter);
  }

  if (_searchQuery) {
    filtered = filtered.filter(v =>
      v.name.toLowerCase().includes(_searchQuery) ||
      v.locality.toLowerCase().includes(_searchQuery) ||
      v.cuisine.toLowerCase().includes(_searchQuery)
    );
  }

  const countEl = document.getElementById('results-count');
  if (countEl) countEl.textContent = filtered.length + ' kitchen' + (filtered.length !== 1 ? 's' : '') + ' found';

  const grid = document.getElementById('vendor-list');
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <span class="material-symbols-outlined text-slate-300 text-5xl mb-2">search_off</span>
        <h3 class="font-bold text-slate-800 text-base">No matching kitchens found</h3>
        <p class="text-xs text-slate-500 mt-1">Try adjusting your search terms or clearing the filter.</p>
        <button class="btn btn-outline btn-sm text-xs mt-4" onclick="setFilter('All'); document.getElementById('vendor-search').value=''; _searchQuery='';">Reset Search</button>
      </div>
    `;
  } else {
    grid.innerHTML = filtered.map(v => renderVendorCard(v, _hasActiveSub)).join('');
  }
}

function renderVendorCard(vendor, hasActiveSub) {
  const rating = vendor.overall_rating;
  const vendorImg = getVendorImage(vendor.vendor_id);

  return `
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group" id="vendor-card-${vendor.vendor_id}" role="article" aria-label="${vendor.name}">
      
      <!-- Top Image Banner -->
      <div class="relative h-44 w-full overflow-hidden bg-slate-100">
        <img src="${vendorImg}" alt="${vendor.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='/images/thali_special.png'" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
        
        <div class="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-800 shadow-sm">
          <span class="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
          Verified
        </div>

        <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-900 shadow-sm flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px] text-amber-500">star</span>
          ${rating ? rating.toFixed(1) : 'New'}
        </div>

        <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div>
            <h3 class="font-heading font-extrabold text-base leading-tight">${vendor.name}</h3>
            <div class="text-[11px] text-slate-200 flex items-center gap-1 mt-0.5">
              <span class="material-symbols-outlined text-[13px]">location_on</span>
              ${vendor.locality}, ${vendor.city}
            </div>
          </div>
          <div class="text-right">
            <div class="text-[10px] text-slate-300 uppercase font-semibold">Starts at</div>
            <div class="font-extrabold text-emerald-300 text-sm">${formatINR(vendor.min_price)}<span class="text-[10px] font-normal text-slate-200">/mo</span></div>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="p-5 flex flex-col flex-1 justify-between gap-4">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              🍽️ ${vendor.cuisine}
            </span>
            <span class="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              👥 ${vendor.active_subscribers} subscribers
            </span>
          </div>
          <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            Fresh homestyle preparation with quality ingredients. Daily menu rotation with lunch & dinner options.
          </p>
        </div>

        <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button class="btn btn-outline btn-sm flex-1 text-xs font-semibold" onclick="navigateTo('vendorDetails', '${vendor.vendor_id}')" id="btn-details-${vendor.vendor_id}">
            View Plans
          </button>
          <button class="btn btn-primary btn-sm flex-1 text-xs font-semibold"
            ${hasActiveSub ? 'disabled title="Switch via your subscription page"' : ''}
            onclick="openSubscribeModal('${vendor.vendor_id}')"
            id="btn-subscribe-${vendor.vendor_id}"
            aria-label="Subscribe to ${vendor.name}">
            ${hasActiveSub ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
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

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:var(--radius);padding:10px 14px;margin-bottom:14px;font-size:0.82rem;color:#166534">
              💵 <strong>Payment Method:</strong> Cash on Delivery (COD) / Direct UPI on First Tiffin Handover.
            </div>

            <div class="modal-actions">
              <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
              <button class="btn btn-primary" onclick="confirmSubscription('${vendorId}')" id="btn-confirm-sub">Request Subscription (COD)</button>
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
      <p style="color:var(--color-text-muted)">${plan.description || 'Homestyle healthy food'}</p>
      <div style="display:flex;gap:16px;margin-top:8px;font-size:0.8rem;color:var(--color-text-muted);flex-wrap:wrap">
        <span>📅 Start: ${formatDate(today.toISOString().split('T')[0])}</span>
        <span>📅 End: ${formatDate(endDate.toISOString().split('T')[0])}</span>
        <span>${plan.veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
        <span>🍽️ ${plan.meals_per_day || 1} meal${(plan.meals_per_day || 1) > 1 ? 's' : ''}/day</span>
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
  btn.textContent = 'Processing Request...';

  // Show animated process steps
  const modal = document.querySelector('.modal');
  modal.innerHTML = `
    <h3>Subscription Request Process</h3>
    <div class="process-steps" id="proc-steps" aria-live="polite">
      <div class="process-step" id="step-1"><span class="step-icon pending" aria-hidden="true">⏳</span> Checking vendor active status...</div>
      <div class="process-step" id="step-2"><span class="step-icon pending" aria-hidden="true">⏳</span> Checking existing active/pending requests...</div>
      <div class="process-step" id="step-3"><span class="step-icon pending" aria-hidden="true">⏳</span> Creating subscription request (pending)...</div>
      <div class="process-step" id="step-4"><span class="step-icon pending" aria-hidden="true">⏳</span> Initializing COD payment ledger (pending_cash)...</div>
      <div class="process-step" id="step-5"><span class="step-icon pending" aria-hidden="true">⏳</span> COMMIT</div>
    </div>
    <div id="proc-result" style="margin-top:16px"></div>
  `;

  const delay = ms => new Promise(r => setTimeout(r, ms));
  try {
    await delay(350);  markStep('step-1', 'done', '✓');
    await delay(350);  markStep('step-2', 'done', '✓');
    await delay(350);  markStep('step-3', 'running', '⟳');

    const result = await createSubscription(planId, vendorId);

    markStep('step-3', 'done', '✓');
    await delay(300);  markStep('step-4', 'done', '✓');
    await delay(300);  markStep('step-5', 'done', '✓ COMMIT');

    document.getElementById('proc-result').innerHTML = `
      <div class="alert alert-success" style="margin-top:8px">
        ✅ <strong>Subscription Request Submitted!</strong><br>
        <p style="margin:6px 0 0 0;font-size:0.875rem">
          Your request for <strong>${result.plan.name}</strong> (Amount Due: ${formatINR(result.plan.price)}) has been submitted to the vendor. You will be notified once approved. Payment will be collected in cash/direct UPI upon meal handover.
        </p>
      </div>
      <button class="btn btn-primary" style="margin-top:12px;width:100%" onclick="closeModal();navigateTo('studentDashboard')">View in Dashboard</button>
    `;
    showToast('Request Submitted!', `Request for ${result.plan.name} sent to vendor.`, 'success');
  } catch (err) {
    markStep('step-3', 'failed', '✗');
    document.getElementById('proc-result').innerHTML = `
      <div class="alert alert-error">❌ ${err.message}</div>
      <button class="btn btn-outline" style="margin-top:12px;width:100%" onclick="closeModal()">Close</button>
    `;
    showToast('Request Failed', err.message, 'error');
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

