// ============================================================
// TiffinTrack - Today's Meal Page
// public/js/pages/todayMeal.js
// ============================================================

async function renderTodayMeal() {
  showLoading();
  try {
    const [subscription, deliveries] = await Promise.all([
      getSubscription(),
      getDeliveries('student')
    ]);

    if (!subscription) {
      showContent(`
        <div class="page-header"><h1>🍽️ Today's Meal</h1></div>
        <div class="card" style="text-align:center;padding:48px">
          <div style="font-size:3rem;margin-bottom:12px">🍽️</div>
          <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:8px">No Active Subscription</h2>
          <p style="color:var(--color-text-muted)">Subscribe to a tiffin plan to see today's meal.</p>
          <button class="btn btn-primary" style="margin-top:16px" onclick="navigateTo('findTiffin')">Find a Plan</button>
        </div>
      `);
      return;
    }

    // Get today's menu from the subscribed vendor
    const menu = await getVendorMenu(subscription.vendor_id);
    const todayDelivery = deliveries.find(d => d.meal_type === 'Lunch');

    showContent(`
      <div class="page-header">
        <h1>🍽️ Today's Meal</h1>
        <p>${subscription.vendor.name} • ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <!-- Delivery Status -->
      ${todayDelivery ? `
      <div class="card" style="margin-bottom:20px">
        <div class="card-title"><span class="icon">🛵</span> Delivery Status</div>
        ${renderDeliveryTracker(todayDelivery.status)}
        <p style="text-align:center;font-size:0.85rem;color:var(--color-text-muted);margin-top:8px">
          ${getDeliveryStatusText(todayDelivery.status)}
        </p>
      </div>` : ''}

      <!-- Menu -->
      <div class="card">
        <div class="card-title"><span class="icon">🥘</span> Today's Menu</div>
        ${menu.published && menu.items.length > 0 ? `
          <div class="menu-grid">
            ${menu.items.map(item => `
              <div class="menu-item">
                <div class="item-name">${item.name}</div>
                <div class="item-category">${item.category}</div>
                <div class="item-quantity">${item.quantity}</div>
              </div>
            `).join('')}
          </div>
          <p style="margin-top:12px;font-size:0.8rem;color:var(--color-text-muted)">
            Menu published by ${subscription.vendor.name}
          </p>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>Menu not published yet</h3>
            <p>The vendor hasn't published today's menu. Check back soon.</p>
          </div>
        `}
      </div>

      <!-- Plan Info -->
      <div class="card" style="margin-top:20px">
        <div class="card-title"><span class="icon">📋</span> Your Plan</div>
        <div style="font-size:0.875rem;display:flex;gap:24px;flex-wrap:wrap;color:var(--color-text-muted)">
          <div><strong style="color:var(--color-text)">${subscription.plan.name}</strong></div>
          <div>🍽️ ${subscription.plan.meals_per_day} meals/day</div>
          <div>${subscription.plan.veg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}</div>
          <div>📅 Valid until ${formatDate(subscription.end_date)}</div>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load today\'s meal: ' + err.message);
  }
}

function getDeliveryStatusText(status) {
  const texts = {
    pending:          'Your meal is being prepared and will be dispatched soon.',
    out_for_delivery: 'Your tiffin is on the way! Should arrive within 20–30 minutes.',
    delivered:        'Your meal has been delivered. Enjoy your food! 🎉'
  };
  return texts[status] || '';
}
