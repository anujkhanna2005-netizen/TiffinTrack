// ============================================================
// TiffinTrack - Vendor Meal Plans Page
// public/js/pages/vendorMealPlans.js
// ============================================================

async function renderVendorMealPlans() {
  showLoading();
  try {
    const plans = await getVendorMealPlans('V001');

    showContent(`
      <div class="page-header">
        <h1>📋 Meal Plans</h1>
        <p>Annapurna Tiffin Services — Available subscription plans</p>
      </div>

      <div class="plan-grid">
        ${plans.map(plan => `
          <div class="plan-card" id="plan-card-${plan.plan_id}">
            <div class="plan-name">${plan.name}</div>
            <div class="plan-price">${formatINR(plan.price)}<span style="font-size:0.8rem;font-weight:400;color:var(--color-text-muted)">/month</span></div>
            <div class="plan-meta" style="margin:8px 0">
              <div>🍽️ ${plan.meals_per_day} meal${plan.meals_per_day > 1 ? 's' : ''} per day</div>
              <div style="margin-top:4px">📝 ${plan.description}</div>
            </div>
            <span class="plan-tag ${plan.veg ? 'veg' : 'nonveg'}">${plan.veg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}</span>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;font-size:0.82rem;color:var(--color-text-muted)">
              <span>Plan ID: ${plan.plan_id}</span>
              <span class="badge badge-active">Available</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card" style="margin-top:20px">
        <div class="card-title">ℹ️ About These Plans</div>
        <p style="font-size:0.875rem;color:var(--color-text-muted)">
          These are the meal plans currently offered by Annapurna Tiffin Services. 
          Students can browse and subscribe to these plans from the student-side "Find Tiffin" page.
          Plan management (adding/editing/removing plans) is a feature planned for Phase 2.
        </p>
      </div>
    `);
  } catch (err) {
    showError('Failed to load meal plans: ' + err.message);
  }
}
