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

    // Get today's menu and live voting options from the subscribed vendor
    const [menu, voteData] = await Promise.all([
      getVendorMenu(subscription.vendor_id),
      getMenuVoteOptions(subscription.vendor_id).catch(() => ({ options: [], user_voted: null }))
    ]);

    const voteOptions = (voteData && voteData.options) ? voteData.options : [];
    const userVotedDish = voteData ? voteData.user_voted : null;

    showContent(`
      <div class="page-header">
        <h1>🍽️ Today's Menu</h1>
        <p>${escapeHtml(subscription.vendor.name)} • ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <!-- Menu -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-title"><span class="icon">🥘</span> Today's Menu</div>
        ${menu.published && menu.items.length > 0 ? `
          <div class="menu-grid">
            ${menu.items.map(item => `
              <div class="menu-item">
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-category">${escapeHtml(item.category)}</div>
                <div class="item-quantity">${escapeHtml(item.quantity)}</div>
              </div>
            `).join('')}
          </div>
          <p style="margin-top:12px;font-size:0.8rem;color:var(--color-text-muted)">
            Menu published by ${escapeHtml(subscription.vendor.name)}
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
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
          <div class="card-title" style="margin-bottom:0"><span class="icon">🗳️</span> Add-on 2: Weekly Community Dish Voting</div>
          ${userVotedDish ? `<span class="badge badge-success">✓ You Voted: ${escapeHtml(userVotedDish)}</span>` : ''}
        </div>
        <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:14px">
          Vote for your favorite dish to be included in tomorrow's special menu for <strong>${escapeHtml(subscription.vendor.name)}</strong>. The vendor reviews student votes live in their kitchen center!
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          ${voteOptions.map(opt => {
            const isVoted = userVotedDish && userVotedDish.toLowerCase() === opt.dish_name.toLowerCase();
            return `
              <button class="btn ${isVoted ? 'btn-primary' : 'btn-outline'}" 
                style="text-align:left;padding:12px;display:flex;flex-direction:column;justify-content:space-between;border-color:${isVoted ? 'var(--color-primary)' : 'var(--color-border)'}" 
                ${userVotedDish ? 'disabled' : ''} 
                onclick="handleCastVote('${escapeHtml(opt.dish_name)}', '${subscription.vendor_id}')">
                <div>
                  <div style="font-weight:700;font-size:0.92rem">${isVoted ? '✓ ' : '🍛 '}${escapeHtml(opt.dish_name)}</div>
                  <div style="font-size:0.75rem;color:${isVoted ? 'rgba(255,255,255,0.85)' : 'var(--color-text-muted)'};margin-top:2px">${escapeHtml(opt.description || opt.cuisine || '')}</div>
                </div>
                <div style="margin-top:8px;font-size:0.75rem;font-weight:600;color:${isVoted ? '#fff' : 'var(--color-primary)'}">
                  🗳️ ${opt.votes || 0} student vote${(opt.votes || 0) === 1 ? '' : 's'}
                </div>
              </button>
            `;
          }).join('')}
        </div>
        <div id="vote-alert" style="margin-top:12px">
          ${userVotedDish ? `<div class="alert alert-info" style="font-size:0.82rem">You have already recorded your vote for today's menu. Check back tomorrow for the winning selection!</div>` : ''}
        </div>
      </div>

      <!-- Plan Info -->
      <div class="card">
        <div class="card-title"><span class="icon">📋</span> Your Plan</div>
        <div style="font-size:0.875rem;display:flex;gap:24px;flex-wrap:wrap;color:var(--color-text-muted)">
          <div><strong style="color:var(--color-text)">${escapeHtml(subscription.plan.name)}</strong></div>
          <div>🍽️ ${subscription.plan.meals_per_day} meals/day</div>
          <div>${subscription.plan.veg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}</div>
          <div>📅 Valid until ${formatDate(subscription.end_date)}</div>
          <div>🍞 Preference: <strong>${subscription.bread_preference === 'extra_roti' ? '+1 Extra Butter Roti' : (subscription.bread_preference === 'rice_only' ? 'Extra Rice (No Roti)' : 'Standard Roti')}</strong></div>
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
        Your vote has been sent to your vendor kitchen for tomorrow's community menu selection.
      </div>
    `;
    showToast('Vote Recorded', 'Voted for ' + dishName, 'success');
    setTimeout(() => renderTodayMeal(), 1000);
  } catch (err) {
    alertDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
  }
}

