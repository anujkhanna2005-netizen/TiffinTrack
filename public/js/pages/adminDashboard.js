// ============================================================
// TiffinTrack - Admin Dashboard
// public/js/pages/adminDashboard.js
// ============================================================

async function renderAdminDashboard() {
  showLoading();
  try {
    const data = await getAdminData();
    const { stats, vendor_performance, customer_activity, complaint_overview } = data;

    showContent(`
      <div class="page-header">
        <h1>🔧 Admin Dashboard</h1>
        <p>TiffinTrack Administrator — Platform Overview</p>
      </div>

      <!-- Platform Stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">${stats.total_students}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Vendors</div>
          <div class="stat-value">${stats.total_vendors}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Delivery Agents</div>
          <div class="stat-value">${stats.total_agents}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Subscriptions</div>
          <div class="stat-value">${stats.active_subscriptions}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Today's Deliveries</div>
          <div class="stat-value">${stats.today_deliveries}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Complaints</div>
          <div class="stat-value" style="color:${stats.pending_complaints > 0 ? 'var(--color-danger)' : 'var(--color-success)'}">
            ${stats.pending_complaints}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Platform Avg Rating</div>
          <div class="stat-value">${stats.platform_avg_rating ? stats.platform_avg_rating.toFixed(1) : '—'}</div>
        </div>
      </div>

      <!-- Vendor Performance Table -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-title"><span class="icon">🏪</span> Vendor Performance</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Vendor</th><th>Location</th><th>Rating</th><th>Active Subscribers</th><th>Today's Deliveries</th><th>Pending Complaints</th></tr>
            </thead>
            <tbody>
              ${vendor_performance.map(v => `
                <tr>
                  <td><strong>${v.name}</strong></td>
                  <td>${v.locality}</td>
                  <td>${v.overall_rating ? '⭐ ' + v.overall_rating.toFixed(1) : '—'}</td>
                  <td>${v.active_subscribers}</td>
                  <td>${v.today_deliveries}</td>
                  <td>
                    <span class="${v.pending_complaints > 0 ? 'badge badge-pending' : 'badge badge-success'}">
                      ${v.pending_complaints}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Complaint Overview -->
      <div class="card">
        <div class="card-title"><span class="icon">📢</span> Complaint Overview</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Complaint ID</th><th>Student</th><th>Vendor</th><th>Issue</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${complaint_overview.map(c => `
                <tr>
                  <td class="complaint-id">${c.complaint_id}</td>
                  <td>${c.customer_name}</td>
                  <td>${c.vendor_name}</td>
                  <td>${c.issue_type}</td>
                  <td>${formatDate(c.created_at)}</td>
                  <td><span class="badge badge-${c.status}">${c.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load admin dashboard: ' + err.message);
  }
}
