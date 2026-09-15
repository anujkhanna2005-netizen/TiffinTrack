// ============================================================
// TiffinTrack - My Subscription Page
// public/js/pages/mySubscription.js
// ============================================================

async function renderMySubscription() {
  showLoading();
  try {
    const [subscription, customer] = await Promise.all([
      getSubscription(),
      getCustomer()
    ]);

    showContent(`
      <div class="page-header">
        <h1>📋 My Subscription</h1>
        <p>Manage your current meal plan subscription.</p>
      </div>

      ${subscription ? renderSubscriptionDetails(subscription, customer) : renderNoSub()}
    `);
  } catch (err) {
    showError('Failed to load subscription: ' + err.message);
  }
}

function renderSubscriptionDetails(sub, customer) {
  const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return `
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
      <div>
        <!-- Subscription Summary Card -->
        <div class="card subscription-card" style="margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h2 style="font-size:1.1rem;font-weight:700">${sub.plan.name}</h2>
            <span class="badge badge-active">Active</span>
          </div>

          <div class="sub-meta-grid" style="grid-template-columns:repeat(3,1fr)">
            <div class="sub-meta-item">
              <div class="label">Vendor</div>
              <div class="value">${sub.vendor.name}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Cuisine</div>
              <div class="value">${sub.vendor.cuisine}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Location</div>
              <div class="value">${sub.vendor.locality}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Monthly Price</div>
              <div class="value" style="color:var(--color-primary)">${formatINR(sub.plan.price)}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Start Date</div>
              <div class="value">${formatDate(sub.start_date)}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">End Date</div>
              <div class="value">${formatDate(sub.end_date)}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Days Left</div>
              <div class="value">${daysLeft > 0 ? daysLeft + ' days' : 'Expired'}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Meals/Day</div>
              <div class="value">${sub.plan.meals_per_day}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Meal Type</div>
              <div class="value">${sub.plan.veg ? '🟢 Veg' : '🔴 Non-Veg'}</div>
            </div>
          </div>

          <div style="margin-top:16px;padding:12px;background:#faf7f3;border-radius:var(--radius)">
            <div style="font-size:0.82rem;color:var(--color-text-muted)">Plan Description</div>
            <div style="font-size:0.9rem;margin-top:4px">${sub.plan.description || 'Homestyle healthy meals.'}</div>
          </div>

          <div id="cancel-result" style="margin-top:12px"></div>

          <div class="sub-actions" style="margin-top:16px;display:flex;gap:10px">
            <button class="btn btn-outline btn-sm" onclick="openSwitchVendorModal('${sub.vendor_id}')">
              🔄 Switch Vendor
            </button>
            <button class="btn btn-danger btn-sm" onclick="handleCancelFromSubPage()" id="btn-cancel-sub-page">
              Cancel Subscription
            </button>
          </div>
        </div>

        <!-- ADD-ON 1: SKIP / PAUSE MEAL -->
        <div class="card" style="margin-bottom:20px">
          <div class="card-title"><span class="icon">⏸️</span> Add-on 1: Pause & Skip Meal (Get ₹80 Credit)</div>
          <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:14px">
            Going home for the weekend or dining out? Skip tomorrow's meal before cutoff and receive an automatic <strong>₹80.00 wallet credit</strong>.
          </p>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div class="form-group">
              <label for="skip-date" style="font-weight:600">Skip Date</label>
              <input type="date" id="skip-date" class="form-control" value="${tomorrow}" min="${tomorrow}" />
            </div>
            <div class="form-group">
              <label for="skip-meal" style="font-weight:600">Meal</label>
              <select id="skip-meal" class="form-control">
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
            <div class="form-group">
              <label for="skip-reason" style="font-weight:600">Reason</label>
              <input type="text" id="skip-reason" class="form-control" placeholder="e.g. Visiting home" />
            </div>
          </div>
          <div id="skip-alert"></div>
          <button class="btn btn-primary btn-sm" onclick="handleSkipMealSubmit()" id="btn-skip-submit" style="margin-top:8px">
            ✓ Request Skip & Claim ₹80 Credit
          </button>
        </div>

        <!-- ADD-ON 4: MEAL CUSTOMIZATION -->
        <div class="card" style="margin-bottom:20px">
          <div class="card-title"><span class="icon">🌶️</span> Add-on 4: Meal Customization & Spice Preferences</div>
          <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:14px">
            Set your daily cooking preferences for the vendor.
          </p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="form-group">
              <label for="pref-spice" style="font-weight:600">Spice Level</label>
              <select id="pref-spice" class="form-control">
                <option value="low">🌶️ Low Spice / Mild</option>
                <option value="medium" selected>🌶️🌶️ Medium Spice (Standard)</option>
                <option value="high">🌶️🌶️🌶️ High Spice (Desi)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="pref-roti" style="font-weight:600">Bread Preference</label>
              <select id="pref-roti" class="form-control">
                <option value="standard">Standard Rotis</option>
                <option value="extra_roti">+1 Extra Butter Roti</option>
                <option value="rice_only">Extra Rice instead of Roti</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="pref-notes" style="font-weight:600">Special Cooking Instructions</label>
            <input type="text" id="pref-notes" class="form-control" placeholder="e.g. Less oil, no coriander, warm packaging" />
          </div>
          <div id="pref-alert"></div>
          <button class="btn btn-outline btn-sm" onclick="handleSavePreferences()" id="btn-pref-submit">
            💾 Save Preferences
          </button>
        </div>

      </div>

      <!-- Sidebar: Wallet, Add-on 3 (Group Sub), Plan Info -->
      <div>
        <!-- Wallet Card -->
        <div class="stat-card" style="margin-bottom:16px">
          <div class="stat-label">Student Wallet Balance</div>
          <div class="stat-value" id="wallet-balance-val">${formatINR(customer.wallet)}</div>
          <div class="stat-sub">Includes meal refund credits & savings</div>
        </div>

        <!-- ADD-ON 3: FLAT / GROUP SUBSCRIPTION -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-title"><span class="icon">👥</span> Add-on 3: Flat Group (10% Off)</div>
          <p style="font-size:0.82rem;color:var(--color-text-muted);margin-bottom:10px">
            Coordinate with roommates in your flat to get <strong>10% group discount</strong> on renewals!
          </p>
          <div class="form-group">
            <label for="group-code-input" style="font-size:0.8rem;font-weight:600">Join Existing Group Code</label>
            <div style="display:flex;gap:6px">
              <input type="text" id="group-code-input" class="form-control" placeholder="e.g. FLAT4B" style="text-transform:uppercase" />
              <button class="btn btn-primary btn-sm" onclick="handleJoinGroup()">Join</button>
            </div>
          </div>
          <div style="border-top:1px dashed var(--color-border);padding-top:10px;margin-top:10px">
            <button class="btn btn-outline btn-sm" style="width:100%" onclick="handleCreateFlatGroup('${customer.residence || 'Campus PG'}')">
              ➕ Create New Flat Group
            </button>
          </div>
          <div id="group-alert" style="margin-top:8px"></div>
        </div>

        <!-- Plan Info -->
        <div class="card">
          <div class="card-title">ℹ️ Subscription Status</div>
          <div style="font-size:0.85rem;display:flex;flex-direction:column;gap:8px;color:var(--color-text-muted)">
            <div>🍽️ ${sub.plan.meals_per_day} meal(s) per day</div>
            <div>${sub.plan.veg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}</div>
            <div>📅 Valid until ${formatDate(sub.end_date)}</div>
          </div>
          <div style="margin-top:14px">
            <button class="btn btn-outline btn-sm" style="width:100%" onclick="navigateTo('findTiffin')">Browse All Vendors</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderNoSub() {
  return `
    <div class="card" style="text-align:center;padding:48px">
      <div style="font-size:3rem;margin-bottom:12px">📭</div>
      <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:8px">No Active Subscription</h2>
      <p style="color:var(--color-text-muted);margin-bottom:20px">You don't have an active meal plan subscription yet.</p>
      <button class="btn btn-primary" onclick="navigateTo('findTiffin')">Find a Tiffin Plan</button>
    </div>
  `;
}

async function handleCancelFromSubPage() {
  if (!confirm('Are you sure you want to cancel your subscription?')) return;
  const btn = document.getElementById('btn-cancel-sub-page');
  btn.disabled = true;
  btn.textContent = 'Cancelling...';

  const resultDiv = document.getElementById('cancel-result');
  resultDiv.innerHTML = `
    <div class="process-steps">
      <div class="process-step" id="cs-1"><span class="step-icon running">⟳</span> Cancelling subscription...</div>
      <div class="process-step" id="cs-2"><span class="step-icon pending">⏳</span> Updating status...</div>
    </div>
  `;

  const delay = ms => new Promise(r => setTimeout(r, ms));
  try {
    await delay(500);
    markStep('cs-1', 'done', '✓');
    await delay(400);
    await cancelSubscription();
    markStep('cs-2', 'done', '✓');

    setTimeout(() => {
      resultDiv.innerHTML += '<div class="alert alert-success" style="margin-top:10px">Subscription cancelled successfully. Status: CANCELLED</div>';
      setTimeout(() => renderMySubscription(), 1500);
    }, 200);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Cancel Subscription';
    resultDiv.innerHTML = '<div class="alert alert-error">' + err.message + '</div>';
  }
}

// Add-on 1: Handle Skip Meal
async function handleSkipMealSubmit() {
  const skipDate = document.getElementById('skip-date').value;
  const mealType = document.getElementById('skip-meal').value;
  const reason   = document.getElementById('skip-reason').value.trim() || 'Personal plans';
  const alertDiv = document.getElementById('skip-alert');
  const btn      = document.getElementById('btn-skip-submit');

  if (!skipDate) {
    alertDiv.innerHTML = '<div class="alert alert-warning">Please select a valid skip date.</div>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Processing refund...';

  try {
    const res = await skipMeal(skipDate, mealType, reason);
    const newBal = res.new_wallet_balance !== undefined ? res.new_wallet_balance : res.wallet_balance;

    const walletEl = document.getElementById('wallet-balance-val');
    if (walletEl && newBal !== undefined) {
      walletEl.textContent = formatINR(newBal);
    }

    alertDiv.innerHTML = `
      <div class="alert alert-success" style="margin-top:10px">
        ✅ <strong>Meal Skipped Successfully!</strong><br>
        ₹80.00 credited to your wallet balance. Updated Wallet: <strong>${formatINR(newBal)}</strong>.
      </div>
    `;
    showToast('Skip Confirmed', '₹80.00 credited to your wallet balance.', 'success');
    btn.textContent = '✓ Skipped';
    setTimeout(() => renderMySubscription(), 1500);
  } catch (err) {
    alertDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
    btn.disabled = false;
    btn.textContent = '✓ Request Skip & Claim ₹80 Credit';
  }
}

// Add-on 4: Handle Meal Customization
async function handleSavePreferences() {
  const spice = document.getElementById('pref-spice').value;
  const roti  = document.getElementById('pref-roti').value;
  const notes = document.getElementById('pref-notes').value.trim();
  const alertDiv = document.getElementById('pref-alert');
  const btn = document.getElementById('btn-pref-submit');

  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    await updateMealPreferences({ spice_level: spice, bread_preference: roti, special_notes: notes });
    alertDiv.innerHTML = '<div class="alert alert-success" style="margin-top:10px">✅ Cooking preferences saved and sent to your vendor kitchen.</div>';
    showToast('Preferences Saved', 'Vendor kitchen notified.', 'success');
    btn.disabled = false;
    btn.textContent = '💾 Save Preferences';
  } catch (err) {
    alertDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
    btn.disabled = false;
    btn.textContent = '💾 Save Preferences';
  }
}

// Add-on 3: Handle Flat Groups
async function handleJoinGroup() {
  const code = document.getElementById('group-code-input').value.trim().toUpperCase();
  const alertDiv = document.getElementById('group-alert');
  if (!code) {
    alertDiv.innerHTML = '<div class="alert alert-warning" style="font-size:0.8rem">Please enter a 6-character group code.</div>';
    return;
  }
  try {
    const res = await joinGroupSubscription(code);
    alertDiv.innerHTML = `<div class="alert alert-success" style="font-size:0.8rem">✅ Joined <strong>${escapeHtml(res.group_name || code)}</strong>! 10% group discount activated.</div>`;
    showToast('Group Joined', '10% group discount activated.', 'success');
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert alert-error" style="font-size:0.8rem">❌ ${escapeHtml(err.message)}</div>`;
  }
}

async function handleCreateFlatGroup(residence) {
  const groupName = prompt('Enter a name for your flat group (e.g. Flat 302 Squad):', 'Flat Roommates Group');
  if (!groupName) return;
  const alertDiv = document.getElementById('group-alert');
  try {
    const res = await createGroupSubscription(groupName, residence);
    const code = res.group_code || res.group_id || (res.group && res.group.group_code) || 'GRP001';
    
    const inputEl = document.getElementById('group-code-input');
    if (inputEl) inputEl.value = code;

    alertDiv.innerHTML = `
      <div class="alert alert-success" style="font-size:0.82rem;line-height:1.4">
        ✅ <strong>Flat Group Created!</strong><br>
        Group Name: <strong>${escapeHtml(res.group_name || groupName)}</strong><br>
        Share Code: <strong style="letter-spacing:1px;font-size:0.95rem;color:var(--color-primary)">${escapeHtml(code)}</strong> with your roommates to activate 10% off.
      </div>
    `;
    showToast('Group Created', 'Share code: ' + code, 'success');
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert alert-error" style="font-size:0.8rem">❌ ${escapeHtml(err.message)}</div>`;
  }
}

// Add-on 5: One-Click Instant Vendor Switch
async function openSwitchVendorModal(currentVendorId) {
  try {
    const vendors = await getVendors();
    const otherVendors = vendors.filter(v => v.vendor_id !== currentVendorId);

    if (otherVendors.length === 0) {
      showToast('No Other Vendors', 'No alternative vendors available right now.', 'info');
      return;
    }

    const modalHtml = `
      <div class="modal-overlay" id="switch-modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal" style="max-width:500px">
          <button class="modal-close" onclick="closeModal()">×</button>
          <h3>🔄 Switch Tiffin Vendor</h3>
          <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:14px">
            Switch your subscription seamlessly using ACID transaction without losing remaining days.
          </p>
          <div class="form-group">
            <label for="switch-vendor-select" style="font-weight:600">Choose New Vendor</label>
            <select id="switch-vendor-select" class="form-control" onchange="updateSwitchPlanOptions(this.value)">
              ${otherVendors.map(v => `<option value="${v.vendor_id}">${v.name} (${v.locality}) — ${v.cuisine}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="switch-plan-select" style="font-weight:600">Choose Meal Plan</label>
            <select id="switch-plan-select" class="form-control">
              <!-- Populated dynamically -->
            </select>
          </div>
          <div class="form-group">
            <label for="switch-reason" style="font-weight:600">Reason for Switching</label>
            <input type="text" id="switch-reason" class="form-control" placeholder="e.g. Trying new cuisine" />
          </div>
          <div id="switch-result"></div>
          <div class="modal-actions" style="margin-top:16px">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="confirmVendorSwitch()" id="btn-confirm-switch">Confirm Instant Switch</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    updateSwitchPlanOptions(otherVendors[0].vendor_id);
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function updateSwitchPlanOptions(vendorId) {
  const planSelect = document.getElementById('switch-plan-select');
  if (!planSelect) return;
  try {
    const plans = await getVendorMealPlans(vendorId);
    planSelect.innerHTML = plans.map(p => `
      <option value="${p.plan_id}">${p.name} — ${formatINR(p.price)}/mo (${p.veg ? '🟢 Veg' : '🔴 Non-Veg'})</option>
    `).join('');
  } catch (e) {
    planSelect.innerHTML = '<option value="">No plans found</option>';
  }
}

async function confirmVendorSwitch() {
  const vendorId = document.getElementById('switch-vendor-select').value;
  const planId   = document.getElementById('switch-plan-select').value;
  const reason   = document.getElementById('switch-reason').value.trim() || 'Switched by student';
  const resultDiv = document.getElementById('switch-result');
  const btn = document.getElementById('btn-confirm-switch');

  if (!vendorId || !planId) {
    resultDiv.innerHTML = '<div class="alert alert-warning">Please select a vendor and meal plan.</div>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Switching in Transaction...';

  try {
    const res = await switchVendor(vendorId, planId, reason);
    resultDiv.innerHTML = `
      <div class="alert alert-success" style="margin-top:10px">
        ✅ <strong>Vendor Switched Successfully!</strong><br>
        Transaction Committed. New Vendor: <strong>${res.new_vendor_name || 'Selected Vendor'}</strong>.
      </div>
    `;
    showToast('Switch Complete', 'Your subscription has been switched!', 'success');
    setTimeout(() => {
      closeModal();
      renderMySubscription();
    }, 1500);
  } catch (err) {
    resultDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
    btn.disabled = false;
    btn.textContent = 'Confirm Instant Switch';
  }
}
