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
        <h1>👥 Customer Management</h1>
        <p>Manage, activate, suspend, or deactivate students across flat/hostel residences</p>
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
        <div class="card-title"><span class="icon">👥</span> Student Roster (${customers.length})</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Residence</th>
                <th>Current Vendor</th>
                <th>Plan</th>
                <th>Subscription</th>
                <th>Account Status</th>
                <th>Admin Actions</th>
              </tr>
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
                  <td>
                    <span class="badge ${c.user_status === 'active' ? 'badge-active' : 'badge-pending'}">
                      ${c.user_status ? (c.user_status.charAt(0).toUpperCase() + c.user_status.slice(1)) : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                      ${c.user_status === 'active' ? `
                        <button class="btn btn-outline btn-sm" style="color:var(--color-warning);border-color:var(--color-warning);padding:2px 7px;font-size:0.75rem"
                          onclick="handleToggleCustomerStatus('${c.user_id}', 'suspended', '${c.name}')">
                          ⏸ Suspend
                        </button>
                      ` : `
                        <button class="btn btn-outline btn-sm" style="color:var(--color-success);border-color:var(--color-success);padding:2px 7px;font-size:0.75rem"
                          onclick="handleToggleCustomerStatus('${c.user_id}', 'active', '${c.name}')">
                          ✓ Activate
                        </button>
                      `}
                      <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:2px 7px;font-size:0.75rem"
                        onclick="handleDeleteUser('${c.user_id}', '${c.name}')">
                        🗑 Deactivate
                      </button>
                    </div>
                  </td>
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

async function handleToggleCustomerStatus(userId, newStatus, userName) {
  try {
    await updateUserStatus(userId, newStatus);
    showToast('Status Updated', `${userName} is now ${newStatus}.`, 'success');
    renderAdminCustomers();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function handleDeleteUser(userId, userName) {
  if (!confirm(`Are you sure you want to deactivate account for ${userName}? Active sessions will be revoked.`)) {
    return;
  }
  try {
    await deleteUser(userId);
    showToast('User Deactivated', `${userName} has been deactivated.`, 'success');
    renderAdminCustomers();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}
