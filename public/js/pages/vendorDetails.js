// ============================================================
// TiffinTrack - Vendor Details Page
// public/js/pages/vendorDetails.js
// ============================================================

async function renderVendorDetails(vendorId) {
  showLoading();
  try {
    const [vendor, subscription] = await Promise.all([
      getVendorById(vendorId),
      getSubscription()
    ]);

    const hasActiveSub = subscription !== null;
    const rb = vendor.rating_breakdown;

    showContent(`
      <div style="margin-bottom:12px">
        <button class="btn btn-ghost btn-sm" onclick="navigateTo('findTiffin')">← Back to Find Tiffin</button>
      </div>

      <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px" class="vendor-detail-grid">
        <!-- Left: Main Info -->
        <div>
          <div class="card" style="margin-bottom:20px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
              <div>
                <h1 style="font-size:1.5rem;font-weight:700">${vendor.name}</h1>
                <p style="color:var(--color-text-muted);margin-top:4px">📍 ${vendor.locality}, ${vendor.city}</p>
                <p style="color:var(--color-text-muted);font-size:0.875rem">📞 ${vendor.contact} &nbsp;|&nbsp; 🍽️ ${vendor.cuisine}</p>
                <p style="margin-top:8px;font-size:0.9rem">${vendor.description}</p>
              </div>
              <div style="text-align:right">
                <div style="font-size:2rem;font-weight:700;color:var(--color-primary)">${vendor.overall_rating ? vendor.overall_rating.toFixed(1) : 'New'}</div>
                <div>${renderStars(vendor.overall_rating)}</div>
                <div style="font-size:0.78rem;color:var(--color-text-muted)">${vendor.rating_breakdown ? vendor.rating_breakdown.count + ' reviews' : 'No reviews yet'}</div>
                <div style="margin-top:6px"><span class="badge badge-active">👥 ${vendor.active_subscribers} students</span></div>
              </div>
            </div>
          </div>

          <!-- Rating Breakdown -->
          ${rb ? `
          <div class="card" style="margin-bottom:20px">
            <div class="card-title"><span class="icon">⭐</span> Rating Breakdown</div>
            <div class="rating-breakdown">
              ${[['Taste', rb.taste], ['Hygiene', rb.hygiene], ['Punctuality', rb.punctuality], ['Value for Money', rb.value]].map(([label, val]) => `
                <div class="rating-bar-row">
                  <div class="rating-bar-label">${label}</div>
                  <div class="rating-bar-track"><div class="rating-bar-fill" style="width:${(val/5)*100}%"></div></div>
                  <div class="rating-bar-score">${val}</div>
                </div>
              `).join('')}
            </div>
          </div>` : ''}

          <!-- Today's Menu -->
          <div class="card">
            <div class="card-title"><span class="icon">🍽️</span> Today's Menu</div>
            ${vendor.todays_menu && vendor.todays_menu.items.length > 0 ? `
              <div class="menu-grid">
                ${vendor.todays_menu.items.map(item => `
                  <div class="menu-item">
                    <div class="item-name">${item.name}</div>
                    <div class="item-category">${item.category}</div>
                    <div class="item-quantity">${item.quantity}</div>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color:var(--color-text-muted)">Menu not published yet for today.</p>'}
          </div>
        </div>

        <!-- Right: Plans -->
        <div>
          <div class="card" style="margin-bottom:20px">
            <div class="card-title"><span class="icon">📋</span> Meal Plans</div>
            <div style="display:flex;flex-direction:column;gap:14px">
              ${vendor.meal_plans.map(plan => `
                <div class="plan-card" style="padding:14px">
                  <div class="plan-name">${plan.name}</div>
                  <div class="plan-price">${formatINR(plan.price)}<span style="font-size:0.75rem;font-weight:400">/mo</span></div>
                  <div class="plan-meta">${plan.description}</div>
                  <span class="plan-tag ${plan.veg ? 'veg' : 'nonveg'}">${plan.veg ? '🟢 Veg' : '🔴 Non-Veg'}</span><br>
                  <button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%"
                    ${hasActiveSub ? 'disabled title="Cancel current plan first"' : ''}
                    onclick="openSubscribeModal('${vendor.vendor_id}')"
                    id="btn-plan-sub-${plan.plan_id}">
                    ${hasActiveSub ? '🔒 Subscribed' : 'Subscribe'}
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Recent Reviews -->
          ${vendor.recent_ratings && vendor.recent_ratings.length > 0 ? `
          <div class="card">
            <div class="card-title"><span class="icon">💬</span> Recent Reviews</div>
            <div style="display:flex;flex-direction:column;gap:12px">
              ${vendor.recent_ratings.map(r => `
                <div style="border-bottom:1px solid var(--color-border);padding-bottom:10px">
                  <div style="display:flex;justify-content:space-between;font-size:0.82rem">
                    <span style="font-weight:600">Anonymous Student</span>
                    <span style="color:var(--color-text-muted)">${formatDate(r.created_at)}</span>
                  </div>
                  <div>${renderStars(0.35*r.taste_score+0.25*r.hygiene_score+0.25*r.punctuality_score+0.15*r.value_score)}</div>
                  <p style="font-size:0.85rem;margin-top:4px;color:var(--color-text-muted)">${r.review}</p>
                </div>
              `).join('')}
            </div>
          </div>` : ''}
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load vendor: ' + err.message);
  }
}
