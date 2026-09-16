// ============================================================
// TiffinTrack - Today's Meal & Menu Democracy
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
        <div class="max-w-6xl mx-auto py-2">
          <div class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
            <div class="text-4xl mb-3">🍽️</div>
            <h2 class="text-xl font-extrabold text-slate-900 font-heading">No Active Subscription</h2>
            <p class="text-xs text-slate-500 mt-1 mb-6">Subscribe to a campus tiffin meal plan to see daily menus and cast dish votes.</p>
            <button class="btn btn-primary btn-sm text-xs font-bold" onclick="navigateTo('findTiffin')">Browse Tiffin Kitchens</button>
          </div>
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
      <div class="max-w-6xl mx-auto py-2 flex flex-col gap-6">
        
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span class="material-symbols-outlined text-[14px]">lunch_dining</span>
              Daily Menu & Voting
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Today's Meal & Community Democracy
            </h1>
            <p class="text-slate-500 text-sm mt-1">
              ${escapeHtml(subscription.vendor.name)} • ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
              ${subscription.plan.veg ? 'Pure Veg Homestyle' : 'Standard Menu'}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left Column: Published Menu & Delivery Telemetry (7 cols) -->
          <div class="lg:col-span-7 flex flex-col gap-6">
            
            <!-- Today's Published Menu Card -->
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-700 text-[20px]">restaurant</span>
                  Published Dishes for Today
                </h3>
                <span class="text-xs text-slate-400">Sharma Ji Fresh Kitchen</span>
              </div>

              ${menu.published && menu.items && menu.items.length > 0 ? `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  ${menu.items.map(item => `
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div class="text-sm font-bold text-slate-900">${escapeHtml(item.name)}</div>
                        <div class="text-[11px] text-slate-500 uppercase font-semibold mt-0.5">${escapeHtml(item.category || 'Course')}</div>
                      </div>
                      <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                        ${escapeHtml(item.quantity || 'Standard')}
                      </span>
                    </div>
                  `).join('')}
                </div>
                <div class="text-[11px] text-slate-400 pt-2 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">info</span>
                  Menu verified and dispatched according to student spice preferences.
                </div>
              ` : `
                <div class="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <span class="material-symbols-outlined text-slate-300 text-4xl mb-1">restaurant_menu</span>
                  <div class="font-bold text-slate-700">Today's menu is being prepared in the kitchen</div>
                  <div class="text-slate-400 mt-0.5">The vendor will publish the dish list shortly.</div>
                </div>
              `}
            </div>

            <!-- Active Subscription Dietary Tag -->
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 class="font-heading font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-700 text-[20px]">assignment_turned_in</span>
                Active Plan & Dispatch Configuration
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                <div>
                  <span class="text-slate-400 font-medium">Plan</span>
                  <div class="font-bold text-slate-900 mt-0.5">${escapeHtml(subscription.plan.name)}</div>
                </div>
                <div>
                  <span class="text-slate-400 font-medium">Dietary Type</span>
                  <div class="font-bold text-emerald-700 mt-0.5">${subscription.plan.veg ? 'Vegetarian' : 'Non-Vegetarian'}</div>
                </div>
                <div>
                  <span class="text-slate-400 font-medium">Bread Setting</span>
                  <div class="font-bold text-slate-900 mt-0.5">
                    ${subscription.bread_preference === 'extra_roti' ? '🍞 +1 Extra Roti' : (subscription.bread_preference === 'rice_only' ? '🍚 Extra Rice' : 'Standard Rotis')}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: ADD-ON 2 COMMUNITY MENU VOTING (5 cols) -->
          <div class="lg:col-span-5 flex flex-col gap-6">
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-700 text-[20px]">how_to_vote</span>
                  Menu Democracy Voting
                </h3>
                <span class="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Tomorrow's Menu</span>
              </div>

              <p class="text-xs text-slate-600 leading-relaxed">
                Vote for your favorite dish to be included in tomorrow's special menu for <strong>${escapeHtml(subscription.vendor.name)}</strong>. The winning dish gets added to the daily kitchen prep!
              </p>

              ${userVotedDish ? `
                <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-700 text-[20px]">check_circle</span>
                  <div>
                    Your vote for <strong>${escapeHtml(userVotedDish)}</strong> is registered for tomorrow's menu.
                  </div>
                </div>
              ` : ''}

              <div class="space-y-3">
                ${voteOptions.map(opt => {
                  const isVoted = userVotedDish && userVotedDish.toLowerCase() === opt.dish_name.toLowerCase();
                  return `
                    <button class="w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${isVoted ? 'bg-emerald-800 text-white border-emerald-800 shadow-md' : 'bg-slate-50 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50'}"
                      ${userVotedDish ? 'disabled' : ''}
                      onclick="handleCastVote('${escapeHtml(opt.dish_name)}', '${subscription.vendor_id}')">
                      <div>
                        <div class="text-xs font-bold ${isVoted ? 'text-white' : 'text-slate-900 group-hover:text-emerald-900'}">
                          ${isVoted ? '✓ ' : '🍛 '}${escapeHtml(opt.dish_name)}
                        </div>
                        <div class="text-[11px] ${isVoted ? 'text-emerald-200' : 'text-slate-500'} mt-0.5">
                          ${escapeHtml(opt.description || opt.cuisine || 'Special Recipe')}
                        </div>
                      </div>
                      <span class="text-xs font-bold px-2.5 py-1 rounded-xl ${isVoted ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-emerald-700'}">
                        🗳️ ${opt.votes || 0}
                      </span>
                    </button>
                  `;
                }).join('')}
              </div>

              <div id="vote-alert"></div>
            </div>
          </div>

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
    if (alertDiv) {
      alertDiv.innerHTML = `
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 mt-3">
          ✅ <strong>Vote Cast for ${dishName}!</strong><br>
          Your preference is transmitted to the vendor kitchen for tomorrow's community tally.
        </div>
      `;
    }
    showToast('Vote Recorded', 'Voted for ' + dishName, 'success');
    setTimeout(() => renderTodayMeal(), 800);
  } catch (err) {
    if (alertDiv) alertDiv.innerHTML = '<div class="alert alert-error mt-3">❌ ' + err.message + '</div>';
  }
}


