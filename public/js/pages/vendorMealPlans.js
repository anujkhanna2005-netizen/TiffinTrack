// ============================================================
// TiffinTrack - Vendor Meal Plans Page
// public/js/pages/vendorMealPlans.js
// ============================================================

async function renderVendorMealPlans() {
  showLoading();
  try {
    const vendorData = await getVendorData().catch(() => null);
    const vendor = vendorData ? vendorData.vendor : null;
    const vendorId = vendor ? vendor.vendor_id : null;
    const plans = await getVendorMealPlans(vendorId);

    showContent(`
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Kitchen Management</span>
            <span style="font-size:0.8rem;color:var(--color-text-muted)">• Plan Catalog</span>
          </div>
          <h1 style="font-size:1.6rem;font-weight:800;color:var(--color-text);margin:0">📋 Meal Subscription Plans</h1>
          <p style="color:var(--color-text-muted);margin-top:4px;font-size:0.88rem">${vendor ? escapeHtml(vendor.name) : 'Vendor'} — Manage meal plans available to student diners</p>
        </div>
        <button class="btn btn-primary" onclick="openAddPlanModal()" style="display:flex;align-items:center;gap:6px;padding:10px 18px;font-weight:600;box-shadow:var(--shadow-sm)">
          <span style="font-size:1.1rem">+</span> Add New Meal Plan
        </button>
      </div>

      <div id="plan-alert-container"></div>

      ${plans.length === 0 ? `
        <div class="card" style="text-align:center;padding:48px 24px;border-radius:var(--radius-lg)">
          <div style="font-size:3rem;margin-bottom:14px">🍽️</div>
          <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:6px">No Meal Plans Found</h3>
          <p style="color:var(--color-text-muted);max-width:420px;margin:0 auto 20px;font-size:0.9rem">Create your first subscription package so students can discover and subscribe to your kitchen.</p>
          <button class="btn btn-primary" onclick="openAddPlanModal()">+ Create Meal Plan</button>
        </div>
      ` : `
        <div class="plan-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(290px, 1fr));gap:20px">
          ${plans.map(plan => `
            <div class="plan-card" id="plan-card-${escapeHtml(plan.plan_id)}" style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:20px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:var(--shadow-sm);transition:all var(--transition)">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                  <div class="plan-name" style="font-size:1.15rem;font-weight:800;color:var(--color-text)">${escapeHtml(plan.name || plan.plan_name)}</div>
                  <span class="plan-tag ${plan.veg ? 'veg' : 'nonveg'}" style="font-size:0.75rem;padding:3px 8px;border-radius:9999px;font-weight:700">
                    ${plan.veg ? '🟢 Pure Veg' : '🔴 Non-Veg'}
                  </span>
                </div>
                <div class="plan-price" style="margin:12px 0 10px;display:flex;align-items:baseline;gap:4px">
                  <span style="font-size:1.6rem;font-weight:800;color:var(--color-primary)">${formatINR(plan.price)}</span>
                  <span style="font-size:0.85rem;color:var(--color-text-muted);font-weight:500">/month</span>
                </div>
                <div class="plan-meta" style="margin:12px 0;font-size:0.86rem;color:var(--color-text-muted);line-height:1.5">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;color:var(--color-text);font-weight:600">
                    <span>🍲</span> ${plan.meals_per_day || 1} meal(s) per day (${plan.plan_type || 'Monthly'})
                  </div>
                  <div style="background:var(--color-surface-hover);padding:8px 12px;border-radius:var(--radius);font-size:0.82rem;color:var(--color-text-muted);border:1px solid var(--color-border)">
                    📝 ${escapeHtml(plan.description || 'Nutritious homestyle balanced meals delivered fresh.')}
                  </div>
                </div>
              </div>

              <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:0.75rem;font-family:monospace;color:var(--color-text-muted);background:var(--color-surface-hover);padding:2px 6px;border-radius:4px">ID: ${escapeHtml(plan.plan_id)}</span>
                <button class="btn btn-sm btn-danger" style="padding:4px 12px;font-size:0.78rem;font-weight:600;border-radius:6px" onclick="handleDeletePlan('${escapeHtml(plan.plan_id)}')">✕ Deactivate</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}

      <div class="card" style="margin-top:24px;border-left:4px solid var(--color-primary);background:var(--color-surface);border-radius:var(--radius)">
        <div class="card-title" style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:0.95rem;color:var(--color-primary);margin-bottom:6px">
          ℹ️ Live Subscription Plan Synchronization
        </div>
        <p style="font-size:0.875rem;color:var(--color-text-muted);line-height:1.5;margin:0">
          All active meal plans created here are instantly visible to students in the <strong>Find Tiffin</strong> directory.
          When a student subscribes, their orders and delivery dispatch tasks are automatically scheduled based on the selected plan type.
        </p>
      </div>

      <!-- ADD PLAN MODAL -->
      <div id="add-plan-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)">
        <div class="card" style="max-width:500px;width:100%;max-height:90vh;overflow-y:auto;position:relative;border-radius:var(--radius-lg);box-shadow:var(--shadow-lg)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
            <div>
              <h3 style="margin:0;font-size:1.2rem;font-weight:800;color:var(--color-text)">➕ Add New Meal Plan</h3>
              <p style="margin:2px 0 0;font-size:0.8rem;color:var(--color-text-muted)">Publish a new subscription tier for students</p>
            </div>
            <button onclick="closeAddPlanModal()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--color-text-muted);line-height:1">×</button>
          </div>
          <form id="add-plan-form" onsubmit="handleAddPlanSubmit(event)">
            <div class="form-group" style="margin-bottom:14px">
              <label style="font-weight:600;font-size:0.85rem;margin-bottom:4px;display:block">Plan Name</label>
              <input type="text" id="new-plan-name" class="form-control" placeholder="e.g. Deluxe North Indian Monthly" required />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
              <div class="form-group" style="margin-bottom:0">
                <label style="font-weight:600;font-size:0.85rem;margin-bottom:4px;display:block">Monthly Price (₹)</label>
                <input type="number" id="new-plan-price" class="form-control" placeholder="2400" min="500" max="20000" required />
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label style="font-weight:600;font-size:0.85rem;margin-bottom:4px;display:block">Meals Per Day</label>
                <select id="new-plan-meals" class="form-control">
                  <option value="1">1 Meal / Day (Lunch or Dinner)</option>
                  <option value="2">2 Meals / Day (Lunch & Dinner)</option>
                  <option value="3">3 Meals / Day (Full Day)</option>
                </select>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
              <div class="form-group" style="margin-bottom:0">
                <label style="font-weight:600;font-size:0.85rem;margin-bottom:4px;display:block">Dietary Type</label>
                <select id="new-plan-veg" class="form-control">
                  <option value="veg">🟢 Pure Vegetarian</option>
                  <option value="nonveg">🔴 Non-Vegetarian</option>
                  <option value="both">🟡 Veg + Non-Veg Mix</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label style="font-weight:600;font-size:0.85rem;margin-bottom:4px;display:block">Plan Duration</label>
                <select id="new-plan-type" class="form-control">
                  <option value="monthly">Monthly (30 Days)</option>
                  <option value="weekly">Weekly (7 Days)</option>
                  <option value="trial">Trial (3 Days)</option>
                </select>
              </div>
            </div>
            <div class="form-group" style="margin-bottom:18px">
              <label style="font-weight:600;font-size:0.85rem;margin-bottom:4px;display:block">Description & Menu Inclusions</label>
              <textarea id="new-plan-desc" class="form-control" rows="3" placeholder="Includes 4 Chapatis, Dal Tadka, Seasonal Sabzi, Rice, Salad, and Sweet on Sundays."></textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:12px;border-top:1px solid var(--color-border)">
              <button type="button" class="btn btn-secondary" onclick="closeAddPlanModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-save-plan">Create Plan</button>
            </div>
          </form>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load meal plans: ' + err.message);
  }
}

function openAddPlanModal() {
  const modal = document.getElementById('add-plan-modal');
  if (modal) modal.style.display = 'flex';
}

function closeAddPlanModal() {
  const modal = document.getElementById('add-plan-modal');
  if (modal) modal.style.display = 'none';
}

async function handleAddPlanSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-plan');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }

  try {
    const name = document.getElementById('new-plan-name').value.trim();
    const price = document.getElementById('new-plan-price').value;
    const meals = document.getElementById('new-plan-meals').value;
    const veg = document.getElementById('new-plan-veg').value;
    const planType = document.getElementById('new-plan-type').value;
    const desc = document.getElementById('new-plan-desc').value.trim();

    await createVendorMealPlan({
      name,
      price: parseFloat(price),
      meals_included: parseInt(meals, 10),
      veg_or_nonveg: veg,
      plan_type: planType,
      description: desc
    });

    closeAddPlanModal();
    renderVendorMealPlans();
  } catch (err) {
    alert('Error creating meal plan: ' + err.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Create Plan';
    }
  }
}

async function handleDeletePlan(planId) {
  if (!confirm('Are you sure you want to deactivate this meal plan? Existing subscribers will remain unaffected.')) {
    return;
  }
  try {
    await deleteVendorMealPlan(planId);
    renderVendorMealPlans();
  } catch (err) {
    alert('Failed to deactivate plan: ' + err.message);
  }
}
