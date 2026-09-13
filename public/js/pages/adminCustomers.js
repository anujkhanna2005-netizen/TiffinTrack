// ============================================================
// TiffinTrack - Admin Customers Page
// public/js/pages/adminCustomers.js
// ============================================================

async function renderAdminCustomers() {
  showLoading();
  try {
    const data = await getAdminData();
    const customers = data.customer_activity;

    showContent(`
      <div class="page-header">
        <h1>👥 Customers</h1>
        <p>All registered students on the TiffinTrack platform</p>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">${customers.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Subscriptions</div>
          <div class="stat-value">${customers.filter(c => c.sub_status === 'active').length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Unsubscribed</div>
          <div class="stat-value">${customers.filter(c => c.sub_status !== 'active').length}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span class="icon">👥</span> Customer Activity (${customers.length})</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Residence</th><th>Current Vendor</th><th>Plan</th><th>Subscription Status</th></tr>
            </thead>
            <tbody>
              ${customers.map(c => `
                <tr>
                  <td style="font-size:0.78rem;color:var(--color-text-muted)">${c.customer_id}</td>
                  <td><strong>${c.name}</strong></td>
                  <td>${c.residence}</td>
                  <td>${c.vendor_name}</td>
                  <td>${c.plan_name}</td>
                  <td><span class="badge badge-${c.sub_status}">${c.sub_status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load customers: ' + err.message);
  }
}
