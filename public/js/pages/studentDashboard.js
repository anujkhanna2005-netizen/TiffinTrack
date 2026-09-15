// ============================================================
// TiffinTrack - Student Dashboard
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
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    // Today's lunch delivery for this student
    const todayDelivery = (deliveries && Array.isArray(deliveries)) ? (deliveries.find(d => d.meal_type === 'Lunch') || null) : null;

    const studentFirstName = (customer && customer.name ? customer.name.split(' ')[0] : null) || (currentUser && currentUser.name ? currentUser.name.split(' ')[0] : 'Student');
    const residenceInfo = (customer && (customer.residence || customer.pg_or_flat_name)) ? `${customer.residence || customer.pg_or_flat_name}${customer.room || customer.room_no ? ', Room ' + (customer.room || customer.room_no) : ''}` : 'Hostel / Flat';

    showContent(`
      <div class="page-header">
        <h1>${greeting}, ${studentFirstName} 👋</h1>
        <p>${residenceInfo}</p>
      </div>

      <!-- Stats Row -->
      <div class="stat-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
        <div class="stat-card">
          <div class="stat-label">Wallet Balance</div>
          <div class="stat-value">${formatINR(customer.wallet)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Current Plan</div>
          <div class="stat-value" style="font-size:1rem;margin-top:6px">
            ${subscription ? subscription.plan.name : '<span style="color:var(--color-text-muted);font-size:0.9rem">No active plan</span>'}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Next Billing</div>
          <div class="stat-value" style="font-size:1rem;margin-top:6px">
            ${subscription ? formatDate(subscription.end_date) : '—'}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Today's Delivery</div>
          <div class="stat-value" style="font-size:1rem;margin-top:6px">
            ${todayDelivery ? deliveryStatusBadge(todayDelivery.status) : '<span style="color:var(--color-text-muted);font-size:0.85rem">No delivery today</span>'}
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Subscription Card -->
        <div class="card subscription-card ${subscription ? '' : 'cancelled'}" id="sub-card">
          <div class="card-title"><span class="icon">📋</span> Current Subscription</div>
          ${subscription ? renderActiveSubscriptionCard(subscription) : renderNoSubscriptionCard()}
        </div>

        <!-- Today's Meal Card -->
        <div class="card" id="meal-card">
          <div class="card-title"><span class="icon">🍽️</span> Today's Meal</div>
          ${todayDelivery ? renderTodayMealCard(todayDelivery) : '<div class="empty-state"><div class="empty-icon">🍽️</div><p>No meal delivery scheduled for today.</p><p class="mt-8 text-small text-muted">Subscribe to a plan to get daily meals.</p></div>'}
        </div>

        <!-- Delivery Status Card -->
        ${todayDelivery ? `
        <div class="card">
          <div class="card-title"><span class="icon">🛵</span> Delivery Status</div>
          ${renderDeliveryTracker(todayDelivery.status)}
        </div>` : ''}

        <!-- Quick Actions -->
        <div class="card">
          <div class="card-title"><span class="icon">⚡</span> Quick Actions</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button class="btn btn-primary" onclick="navigateTo('findTiffin')" id="btn-find-tiffin">🔍 Find Tiffin Vendors</button>
            <button class="btn btn-outline" onclick="navigateTo('studentRatings')" id="btn-rate-vendor">⭐ Rate Your Vendor</button>
            <button class="btn btn-outline" onclick="navigateTo('studentComplaints')" id="btn-complaints">📢 Submit a Complaint</button>
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
    <div class="sub-meta-grid">
      <div class="sub-meta-item">
        <div class="label">Vendor</div>
        <div class="value">${sub.vendor.name}</div>
      </div>
      <div class="sub-meta-item">
        <div class="label">Plan</div>
        <div class="value">${sub.plan.name}</div>
      </div>
      <div class="sub-meta-item">
        <div class="label">Price</div>
        <div class="value">${formatINR(sub.plan.price)}/mo</div>
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
        <div class="label">Status</div>
        <div class="value"><span class="badge badge-active">Active</span></div>
      </div>
    </div>
    <div class="sub-actions">
      <button class="btn btn-outline btn-sm" onclick="navigateTo('mySubscription')" id="btn-view-sub">View Details</button>
      <button class="btn btn-danger btn-sm" onclick="handleCancelSubscription()" id="btn-cancel-sub">Cancel Subscription</button>
    </div>
  `;
}

function renderNoSubscriptionCard() {
  return `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>No Active Subscription</h3>
      <p>Browse vendors and subscribe to a meal plan.</p>
    </div>
    <div class="sub-actions" style="margin-top:12px">
      <button class="btn btn-primary" onclick="navigateTo('findTiffin')" id="btn-find-plan">Find a Plan</button>
    </div>
  `;
}

function renderTodayMealCard(delivery) {
  return `
    <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:8px">
      ${delivery.vendor ? delivery.vendor.name : ''} • Lunch
    </p>
    <p style="font-size:0.875rem">View today's full menu on the <a href="#" onclick="navigateTo('todayMeal');return false">Today's Meal</a> page.</p>
  `;
}

function renderDeliveryTracker(status) {
  const steps = [
    { ids: ['prepared', 'pending'],            label: 'Prepared',    icon: '🍳' },
    { ids: ['dispatched', 'out_for_delivery'], label: 'Dispatched',  icon: '🛵' },
    { ids: ['delivered'],                      label: 'Delivered',   icon: '✅' }
  ];
  const idx = steps.findIndex(s => s.ids.includes(status));
  return `
    <div class="delivery-status-track">
      ${steps.map((s, i) => `
        <div class="delivery-step ${i < idx ? 'done' : i === idx ? 'active' : ''}">
          <div class="dot">${s.icon}</div>
          <span class="label">${s.label}</span>
        </div>
      `).join('')}
    </div>
  `;
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
