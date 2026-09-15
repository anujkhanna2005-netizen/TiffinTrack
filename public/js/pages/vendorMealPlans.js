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
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <h1>📋 Meal Subscription Plans</h1>
          <p>${vendor ? escapeHtml(vendor.name) : 'Vendor'} — Manage plans available to students</p>
        </div>
        <button class="btn btn-primary" onclick="openAddPlanModal()">+ Add New Meal Plan</button>
      </div>

      <div id="plan-alert-container"></div>

      ${plans.length === 0 ? `
        <div class="card" style="text-align:center;padding:40px 20px">
          <div style="font-size:2.5rem;margin-bottom:12px">🍽️</div>
          <h3>No Meal Plans Found</h3>
          <p style="color:var(--color-text-muted);max-width:400px;margin:8px auto 16px">Create your first subscription package so students can discover and subscribe to your kitchen.</p>
          <button class="btn btn-primary" onclick="openAddPlanModal()">+ Create Meal Plan</button>
        </div>
      ` : `
        <div class="plan-grid">
          ${plans.map(plan => `
            <div class="plan-card" id="plan-card-${escapeHtml(plan.plan_id)}" style="display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div class="plan-name" style="font-size:1.15rem;font-weight:700">${escapeHtml(plan.name || plan.plan_name)}</div>
                  <span class="plan-tag ${plan.veg ? 'veg' : 'nonveg'}">${plan.veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                </div>
                <div class="plan-price" style="margin:10px 0 6px">
                  ${formatINR(plan.price)}
                  <span style="font-size:0.8rem;font-weight:400;color:var(--color-text-muted)">/month</span>
                </div>
                <div class="plan-meta" style="margin:8px 0;font-size:0.85rem;color:var(--color-text-muted);line-height:1.5">
                  <div>🍲 <strong>${plan.meals_per_day || 1}</strong> meal(s) per day (${plan.plan_type || 'Monthly'})</div>
                  <div style="margin-top:4px">📝 ${escapeHtml(plan.description || 'Nutritious homestyle balanced meals delivered fresh.')}</div>
                </div>
              </div>

              <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:0.78rem;color:var(--color-text-muted)">ID: ${escapeHtml(plan.plan_id)}</span>
                <button class="btn btn-sm btn-danger" style="padding:4px 10px;font-size:0.78rem" onclick="handleDeletePlan('${escapeHtml(plan.plan_id)}')">✕ Deactivate</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}

      <div class="card" style="margin-top:24px">
        <div class="card-title">ℹ️ Live Subscription Plan Synchronization</div>
        <p style="font-size:0.875rem;color:var(--color-text-muted);line-height:1.5">
          All active meal plans created here are instantly visible to students in the <strong>Find Tiffin</strong> directory.
          When a student subscribes, their orders and delivery dispatch tasks are automatically scheduled based on the selected plan type.
        </p>
      </div>

      <!-- ADD PLAN MODAL -->
      <div id="add-plan-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;align-items:center;justify-content:center;padding:16px">
        <div class="card" style="max-width:480px;width:100%;max-height:90vh;overflow-y:auto;position:relative">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="margin:0">➕ Add New Meal Plan</h3>
            <button onclick="closeAddPlanModal()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--color-text-muted)">×</button>
          </div>
          <form id="add-plan-form" onsubmit="handleAddPlanSubmit(event)">
            <div class="form-group">
              <label>Plan Name</label>
              <input type="text" id="new-plan-name" class="form-control" placeholder="e.g. Deluxe North Indian Monthly" required />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group">
                <label>Monthly Price (₹)</label>
                <input type="number" id="new-plan-price" class="form-control" placeholder="2400" min="500" max="20000" required />
              </div>
              <div class="form-group">
                <label>Meals Per Day</label>
                <select id="new-plan-meals" class="form-control">
                  <option value="1">1 Meal / Day (Lunch or Dinner)</option>
                  <option value="2">2 Meals / Day (Lunch & Dinner)</option>
                  <option value="3">3 Meals / Day (Full Day)</option>
                </select>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group">
                <label>Dietary Type</label>
                <select id="new-plan-veg" class="form-control">
                  <option value="veg">🟢 Pure Vegetarian</option>
                  <option value="nonveg">🔴 Non-Vegetarian</option>
                  <option value="both">🟡 Veg + Non-Veg Mix</option>
                </select>
              </div>
              <div class="form-group">
                <label>Plan Duration</label>
                <select id="new-plan-type" class="form-control">
                  <option value="monthly">Monthly (30 Days)</option>
                  <option value="weekly">Weekly (7 Days)</option>
                  <option value="trial">Trial (3 Days)</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Description & Menu Inclusions</label>
              <textarea id="new-plan-desc" class="form-control" rows="3" placeholder="Includes 4 Chapatis, Dal Tadka, Seasonal Sabzi, Rice, Salad, and Sweet on Sundays."></textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
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
