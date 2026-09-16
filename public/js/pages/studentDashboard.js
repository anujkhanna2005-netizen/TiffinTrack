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
          <div class="stat-label">Payment Mode</div>
          <div class="stat-value" style="font-size:0.95rem;margin-top:6px;color:var(--color-primary)">💵 Cash on Delivery</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Current Plan</div>
          <div class="stat-value" style="font-size:1rem;margin-top:6px">
            ${subscription ? subscription.plan.name : '<span style="color:var(--color-text-muted);font-size:0.9rem">No active plan</span>'}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Amount Due</div>
          <div class="stat-value" style="font-size:1.1rem;color:${subscription && subscription.amount_due > 0 ? 'var(--color-warning)' : 'var(--color-success)'}">
            ${subscription ? formatINR(subscription.amount_due) : '—'}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Subscription Status</div>
          <div class="stat-value" style="font-size:1rem;margin-top:6px">
            ${subscription ? (subscription.status === 'pending' ? '<span class="badge badge-pending">Pending Approval</span>' : '<span class="badge badge-active">Active</span>') : '<span style="color:var(--color-text-muted);font-size:0.85rem">No plan</span>'}
          </div>
        </div>
      </div>

      <!-- Pending Request Notification Banner -->
      ${subscription && subscription.status === 'pending' ? `
        <div class="card" style="margin-bottom:20px;border-left:4px solid var(--color-warning);background:#fffaf0">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
            <div>
              <h3 style="color:#b45309;font-size:1rem;margin-bottom:4px">⏳ Subscription Request Pending Approval</h3>
              <p style="font-size:0.85rem;color:var(--color-text-muted);margin:0">
                Your request for <strong>${subscription.plan.name}</strong> from <strong>${subscription.vendor.name}</strong> is awaiting confirmation. Amount Due (₹${subscription.amount_due}) will be payable on first delivery.
              </p>
            </div>
            <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger)" onclick="handleCancelPendingRequest('${subscription.sub_id}')">
              Cancel Request
            </button>
          </div>
        </div>
      ` : ''}

      <div class="dashboard-grid">
        <!-- Subscription Card -->
        <div class="card subscription-card ${subscription ? '' : 'cancelled'}" id="sub-card">
          <div class="card-title"><span class="icon">📋</span> Current Subscription</div>
          ${subscription ? (subscription.status === 'pending' ? renderPendingSubscriptionCard(subscription) : renderActiveSubscriptionCard(subscription)) : renderNoSubscriptionCard()}
        </div>

        <!-- Today's Meal Card -->
        <div class="card" id="meal-card">
          <div class="card-title"><span class="icon">🍽️</span> Today's Menu</div>
          ${subscription && subscription.status === 'active' ? renderTodayMealCard(subscription) : '<div class="empty-state"><div class="empty-icon">🍽️</div><p>No active subscription for today.</p><p class="mt-8 text-small text-muted">Subscribe to a plan to see menus.</p></div>'}
        </div>

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
        <div class="label">Amount Due</div>
        <div class="value" style="color:var(--color-primary)">${formatINR(sub.amount_due)}</div>
      </div>
      <div class="sub-meta-item">
        <div class="label">Payment Status</div>
        <div class="value">${sub.payment_status === 'collected' ? '<span class="badge badge-success">Collected</span>' : '<span class="badge badge-pending">Pending Cash</span>'}</div>
      </div>
      <div class="sub-meta-item">
        <div class="label">Start Date</div>
        <div class="value">${formatDate(sub.start_date)}</div>
      </div>
      <div class="sub-meta-item">
        <div class="label">End Date</div>
        <div class="value">${formatDate(sub.end_date)}</div>
      </div>
    </div>
    <div class="sub-actions">
      <button class="btn btn-outline btn-sm" onclick="navigateTo('mySubscription')" id="btn-view-sub">View Details</button>
      <button class="btn btn-danger btn-sm" onclick="handleCancelSubscription()" id="btn-cancel-sub">Cancel Subscription</button>
    </div>
  `;
}

function renderPendingSubscriptionCard(sub) {
  return `
    <div class="sub-meta-grid">
      <div class="sub-meta-item">
        <div class="label">Vendor</div>
        <div class="value">${sub.vendor.name}</div>
      </div>
      <div class="sub-meta-item">
        <div class="label">Requested Plan</div>
        <div class="value">${sub.plan.name}</div>
      </div>
      <div class="sub-meta-item">
        <div class="label">Amount Due</div>
        <div class="value" style="color:var(--color-primary)">${formatINR(sub.amount_due)} (COD)</div>
      </div>
      <div class="sub-meta-item">
        <div class="label">Request Status</div>
        <div class="value"><span class="badge badge-pending">Awaiting Approval</span></div>
      </div>
    </div>
    <div class="sub-actions">
      <button class="btn btn-danger btn-sm" onclick="handleCancelPendingRequest('${sub.sub_id}')">Withdraw Request</button>
    </div>
  `;
}

function renderNoSubscriptionCard() {
  return `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>No Active Subscription</h3>
      <p>Browse vendors and request a meal plan with Cash on Delivery.</p>
    </div>
    <div class="sub-actions" style="margin-top:12px">
      <button class="btn btn-primary" onclick="navigateTo('findTiffin')" id="btn-find-plan">Find a Plan</button>
    </div>
  `;
}

function renderTodayMealCard(sub) {
  return `
    <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:8px">
      ${sub && sub.vendor ? sub.vendor.name : 'Kitchen'} • ${sub && sub.plan ? sub.plan.name : 'Daily Homestyle'}
    </p>
    <p style="font-size:0.875rem">View today's published menu and vote on the <a href="#" onclick="navigateTo('todayMeal');return false">Today's Menu</a> page.</p>
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
