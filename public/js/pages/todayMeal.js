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
        <h1>🍽️ Today's Menu</h1>
        <p>${subscription.vendor.name} • ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <!-- Menu -->
      <div class="card" style="margin-bottom:20px">
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

      <!-- ADD-ON 2: COMMUNITY MENU VOTING -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-title"><span class="icon">🗳️</span> Add-on 2: Weekly Community Dish Voting</div>
        <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:14px">
          Vote for your favorite dish to be included in tomorrow's special menu. Most voted dish wins!
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
          <button class="btn btn-outline" style="text-align:left;padding:12px" onclick="handleCastVote('Paneer Butter Masala', '${subscription.vendor_id}')">
            🍛 <strong>Paneer Butter Masala</strong><br><span style="font-size:0.75rem;color:var(--color-text-muted)">Creamy tomato gravy</span>
          </button>
          <button class="btn btn-outline" style="text-align:left;padding:12px" onclick="handleCastVote('Rajma Chawal Special', '${subscription.vendor_id}')">
            🍚 <strong>Rajma Chawal Special</strong><br><span style="font-size:0.75rem;color:var(--color-text-muted)">Punjabi style slow cooked</span>
          </button>
          <button class="btn btn-outline" style="text-align:left;padding:12px" onclick="handleCastVote('Hyderabadi Veg Biryani', '${subscription.vendor_id}')">
            🥘 <strong>Hyderabadi Veg Biryani</strong><br><span style="font-size:0.75rem;color:var(--color-text-muted)">Served with fresh raita</span>
          </button>
          <button class="btn btn-outline" style="text-align:left;padding:12px" onclick="handleCastVote('Chole Bhature Platter', '${subscription.vendor_id}')">
            🫓 <strong>Chole Bhature Platter</strong><br><span style="font-size:0.75rem;color:var(--color-text-muted)">Authentic Delhi style</span>
          </button>
        </div>
        <div id="vote-alert" style="margin-top:12px"></div>
      </div>

      <!-- Plan Info -->
      <div class="card">
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

async function handleCastVote(dishName, vendorId) {
  const alertDiv = document.getElementById('vote-alert');
  try {
    await submitMenuVote(dishName, vendorId);
    alertDiv.innerHTML = `
      <div class="alert alert-success" style="margin-top:8px">
        ✅ <strong>Vote Cast for ${dishName}!</strong><br>
        Your vote has been recorded for tomorrow's community menu selection.
      </div>
    `;
    showToast('Vote Recorded', 'Voted for ' + dishName, 'success');
  } catch (err) {
    alertDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
  }
}

function getDeliveryStatusText(status) {
  const texts = {
    prepared:         'Your meal is freshly prepared in the vendor kitchen and ready for dispatch.',
    pending:          'Your meal is being prepared in the vendor kitchen.',
    dispatched:       'Your tiffin has been dispatched from the kitchen and is on the way to your residence.',
    out_for_delivery: 'Your tiffin is on the way to your residence.',
    delivered:        'Your meal has been delivered. Enjoy your food! 🎉',
    skipped:          'Meal paused/skipped for today (₹80 credited to your wallet).'
  };
  return texts[status] || 'Meal delivery in progress.';
}
