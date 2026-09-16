// ============================================================
// TiffinTrack - Student Command Dashboard
// public/js/pages/studentDashboard.js
// ============================================================

async function renderStudentDashboard() {
  showLoading('dashboard');
  try {
    const [customer, subscription, deliveries] = await Promise.all([
      getCustomer(),
      getSubscription(),
      getDeliveries('student')
    ]);

    // Greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // Today's lunch/dinner delivery for this student
    const todayDelivery = (deliveries && Array.isArray(deliveries)) ? (deliveries.find(d => d.meal_type === 'Lunch') || deliveries[0] || null) : null;

    const studentFirstName = (customer && customer.name ? customer.name.split(' ')[0] : null) || (currentUser && currentUser.name ? currentUser.name.split(' ')[0] : 'Student');
    const residenceInfo = (customer && (customer.residence || customer.pg_or_flat_name)) ? `${customer.residence || customer.pg_or_flat_name}${customer.room || customer.room_no ? ', Room ' + (customer.room || customer.room_no) : ''}` : 'Hostel Block A';

    showContent(`
      <div class="flex flex-col gap-6 max-w-6xl mx-auto py-2">
        
        <!-- HERO GREETING & CAMPUS CONTEXT HEADER -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 opacity-10 pointer-events-none text-9xl">🍱</div>
          <div class="relative z-10 flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-emerald-400/20">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Campus Verified Hub
              </span>
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-sm">
                <span class="material-symbols-outlined text-[14px]">location_on</span>
                ${residenceInfo}
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-heading">
              ${greeting}, ${studentFirstName} 👋
            </h1>
            <p class="text-emerald-100/80 text-sm max-w-xl">
              Manage your daily tiffin deliveries, vote on menus, track payment balances, and customize your meals.
            </p>
          </div>

          <div class="relative z-10 flex items-center gap-3">
            <div class="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
              <span class="material-symbols-outlined text-emerald-300 text-[24px]">verified</span>
              <div class="flex flex-col">
                <span class="text-[11px] text-emerald-200 uppercase tracking-wider font-semibold">Active Vendor</span>
                <span class="text-sm font-bold text-white">${subscription && subscription.vendor ? subscription.vendor.name : 'No Provider Active'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- KPI STATS CARDS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Mode</span>
              <span class="material-symbols-outlined text-emerald-600 text-[20px]">payments</span>
            </div>
            <div class="mt-3">
              <div class="text-base sm:text-lg font-bold text-emerald-800">Cash on Delivery</div>
              <div class="text-xs text-slate-500 mt-0.5">Pay upon delivery</div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Plan</span>
              <span class="material-symbols-outlined text-emerald-600 text-[20px]">restaurant_menu</span>
            </div>
            <div class="mt-3">
              <div class="text-base sm:text-lg font-bold text-slate-900 truncate">
                ${subscription ? subscription.plan.name : '<span class="text-slate-400">None</span>'}
              </div>
              <div class="text-xs text-slate-500 mt-0.5">${subscription && subscription.vendor ? subscription.vendor.name : 'Choose a vendor'}</div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Due</span>
              <span class="material-symbols-outlined text-amber-600 text-[20px]">account_balance_wallet</span>
            </div>
            <div class="mt-3">
              <div class="text-xl sm:text-2xl font-extrabold ${subscription && subscription.amount_due > 0 ? 'text-amber-700' : 'text-emerald-700'}">
                ${subscription ? formatINR(subscription.amount_due) : '₹0'}
              </div>
              <div class="text-xs text-slate-500 mt-0.5">${subscription && subscription.amount_due > 0 ? 'Payable to vendor' : 'Fully settled'}</div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Status</span>
              <span class="material-symbols-outlined text-emerald-600 text-[20px]">event_available</span>
            </div>
            <div class="mt-3">
              <div>
                ${subscription ? (subscription.status === 'pending' ? '<span class="badge badge-pending">Pending Approval</span>' : '<span class="badge badge-active">Active</span>') : '<span class="text-xs text-slate-400 font-semibold">Inactive</span>'}
              </div>
              <div class="text-xs text-slate-500 mt-1">${subscription ? formatDate(subscription.start_date) : 'No plan active'}</div>
            </div>
          </div>
        </div>

        <!-- Pending Request Notification Banner -->
        ${subscription && subscription.status === 'pending' ? `
          <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-amber-600 text-[28px]">hourglass_top</span>
                <div>
                  <h3 class="font-bold text-amber-900 text-sm sm:text-base">Subscription Request Pending Confirmation</h3>
                  <p class="text-xs text-amber-700 mt-0.5">
                    Your request for <strong>${subscription.plan.name}</strong> from <strong>${subscription.vendor.name}</strong> is awaiting vendor approval. Amount Due (${formatINR(subscription.amount_due)}) will be collected via COD.
                  </p>
                </div>
              </div>
              <button class="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50" onclick="handleCancelPendingRequest('${subscription.sub_id}')">
                Cancel Request
              </button>
            </div>
          </div>
        ` : ''}

        <!-- MAIN 2-COLUMN SECTION: Today's Meal & Subscription Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Today's Meal Feature Card (7 cols) -->
          <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden" id="mealHeroCard">
            <div>
              <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div class="flex items-center gap-2">
                  <span class="text-[11px] uppercase tracking-wider font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                    Today's Homestyle Tiffin
                  </span>
                  <span class="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    ● Pure Veg
                  </span>
                </div>
                <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">schedule</span>
                  Lunch & Dinner
                </span>
              </div>

              <div class="flex flex-col sm:flex-row gap-5 items-center">
                <div class="w-full sm:w-44 h-36 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 relative group">
                  <img src="/images/tiffin_homestyle.png" alt="Today's Meal" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='/images/thali_special.png'" />
                </div>
                <div class="flex flex-col flex-1">
                  <h3 class="font-heading font-bold text-lg text-slate-900">
                    ${subscription && subscription.vendor ? subscription.vendor.name + ' Special' : 'Sharma Ji Ghar Ki Thali'}
                  </h3>
                  <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                    Fluffy Desi Ghee Phulkas, Paneer Butter Masala, Tadka Dal Fry, Jeera Rice, Fresh Salad & Gulab Jamun.
                  </p>
                  <div class="flex flex-wrap gap-2 mt-3">
                    <span class="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">4 Phulkas</span>
                    <span class="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Dal Tadka</span>
                    <span class="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Paneer Butter</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-100">
              <button class="btn btn-outline btn-sm text-xs font-semibold flex items-center gap-1.5 text-slate-700" onclick="navigateTo('todayMeal')">
                <span class="material-symbols-outlined text-[16px]">visibility</span>
                View Today's Menu & Tracking
              </button>
              <button class="btn btn-primary btn-sm text-xs font-semibold flex items-center gap-1.5" onclick="navigateTo('mySubscription')">
                <span class="material-symbols-outlined text-[16px]">tune</span>
                Customize Add-ons & Skips
              </button>
            </div>
          </div>

          <!-- Subscription Details Card (5 cols) -->
          <div class="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between" id="sub-card">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-700 text-[20px]">assignment</span>
                  Subscription Overview
                </h3>
                <span class="text-xs text-slate-400">#${subscription ? subscription.sub_id : 'S000'}</span>
              </div>

              ${subscription ? (subscription.status === 'pending' ? renderPendingSubscriptionCard(subscription) : renderActiveSubscriptionCard(subscription)) : renderNoSubscriptionCard()}
            </div>

            <!-- Quick Navigation Shortcuts -->
            <div class="pt-4 mt-4 border-t border-slate-100">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Campus Shortcuts</div>
              <div class="grid grid-cols-3 gap-2">
                <button onclick="navigateTo('findTiffin')" class="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 text-center transition-all flex flex-col items-center gap-1 group" id="btn-find-tiffin">
                  <span class="material-symbols-outlined text-emerald-700 text-[20px] group-hover:scale-110 transition-transform">search</span>
                  <span class="text-[11px] font-bold text-slate-700">Find Kitchen</span>
                </button>
                <button onclick="navigateTo('studentRatings')" class="p-2.5 rounded-xl border border-slate-200 hover:border-amber-600 hover:bg-amber-50 text-center transition-all flex flex-col items-center gap-1 group" id="btn-rate-vendor">
                  <span class="material-symbols-outlined text-amber-600 text-[20px] group-hover:scale-110 transition-transform">star</span>
                  <span class="text-[11px] font-bold text-slate-700">Rate Meal</span>
                </button>
                <button onclick="navigateTo('studentComplaints')" class="p-2.5 rounded-xl border border-slate-200 hover:border-purple-600 hover:bg-purple-50 text-center transition-all flex flex-col items-center gap-1 group" id="btn-complaints">
                  <span class="material-symbols-outlined text-purple-600 text-[20px] group-hover:scale-110 transition-transform">support_agent</span>
                  <span class="text-[11px] font-bold text-slate-700">Get Help</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    `);
  } catch (err) {
    showError('Failed to load dashboard: ' + err.message);
  }
}

function renderActiveSubscriptionCard(sub) {
  return `
    <div class="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-3">
      <div class="flex justify-between items-center text-xs">
        <span class="text-slate-500 font-medium">Provider</span>
        <span class="font-bold text-slate-900">${sub.vendor.name}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-slate-500 font-medium">Meal Plan</span>
        <span class="font-bold text-slate-900">${sub.plan.name}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-slate-500 font-medium">Locked Monthly Rate</span>
        <span class="font-bold text-emerald-800">${formatINR(sub.locked_price || sub.plan.price)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-slate-500 font-medium">Amount Due (COD)</span>
        <span class="font-extrabold text-amber-700">${formatINR(sub.amount_due)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-slate-500 font-medium">Subscription Window</span>
        <span class="font-semibold text-slate-700">${formatDate(sub.start_date)} - ${formatDate(sub.end_date)}</span>
      </div>
    </div>
    <div class="flex gap-2">
      <button class="btn btn-outline btn-sm flex-1 text-xs" onclick="navigateTo('mySubscription')" id="btn-view-sub">Manage Plan</button>
      <button class="btn btn-danger btn-sm text-xs" onclick="handleCancelSubscription()" id="btn-cancel-sub">Cancel Plan</button>
    </div>
  `;
}

function renderPendingSubscriptionCard(sub) {
  return `
    <div class="space-y-3 bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 mb-3">
      <div class="flex justify-between items-center text-xs">
        <span class="text-amber-800 font-medium">Vendor</span>
        <span class="font-bold text-slate-900">${sub.vendor.name}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-amber-800 font-medium">Requested Plan</span>
        <span class="font-bold text-slate-900">${sub.plan.name}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-amber-800 font-medium">Amount Due</span>
        <span class="font-bold text-amber-900">${formatINR(sub.amount_due)} (COD)</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-amber-800 font-medium">Status</span>
        <span class="badge badge-pending">Awaiting Approval</span>
      </div>
    </div>
    <div class="flex">
      <button class="btn btn-danger btn-sm w-full text-xs" onclick="handleCancelPendingRequest('${sub.sub_id}')">Withdraw Request</button>
    </div>
  `;
}

function renderNoSubscriptionCard() {
  return `
    <div class="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 mb-3">
      <div class="text-3xl mb-2">🍱</div>
      <h4 class="font-bold text-slate-800 text-sm">No Active Subscription</h4>
      <p class="text-xs text-slate-500 mt-1">Browse campus-verified tiffin providers and subscribe with Cash on Delivery.</p>
      <button class="btn btn-primary btn-sm text-xs mt-4" onclick="navigateTo('findTiffin')" id="btn-find-plan">Browse Tiffin Kitchens</button>
    </div>
  `;
}

function renderTodayMealCard(sub) {
  return `
    <p class="text-xs text-slate-500 mb-2">
      ${sub && sub.vendor ? sub.vendor.name : 'Kitchen'} • ${sub && sub.plan ? sub.plan.name : 'Daily Homestyle'}
    </p>
    <p class="text-xs text-slate-700">View today's published menu and vote on the <a href="#" onclick="navigateTo('todayMeal');return false" class="text-emerald-700 font-bold hover:underline">Today's Menu</a> page.</p>
  `;
}

async function handleCancelPendingRequest(subId) {
  if (!confirm('Are you sure you want to cancel your pending subscription request?')) return;
  try {
    await apiFetch(`/subscription/${subId}/cancel-request`, { method: 'PATCH' });
    showToast('Request Cancelled', 'Your pending subscription request was cancelled.', 'info');
    renderStudentDashboard();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function handleCancelSubscription() {
  if (!confirm('Are you sure you want to cancel your subscription?')) return;
  try {
    await cancelSubscription();
    showToast('Subscription Cancelled', 'Your plan has been cancelled.', 'info');
    renderStudentDashboard();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

