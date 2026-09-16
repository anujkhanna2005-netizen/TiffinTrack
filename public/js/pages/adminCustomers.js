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
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Platform Command Center</span>
            <span style="font-size:0.8rem;color:var(--color-text-muted)">• Student Directory</span>
          </div>
          <h1 style="font-size:1.6rem;font-weight:800;color:var(--color-text);margin:0">👥 Customer & Student Management</h1>
          <p style="color:var(--color-text-muted);margin-top:4px;font-size:0.88rem">Manage, activate, suspend, or deactivate students across flat/hostel residences</p>
        </div>
        <div>
          <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);font-weight:600;padding:8px 14px" onclick="handleAdminPurgeDummyFromCustomers()">
            🧹 Purge Dummy/Spam Accounts
          </button>
        </div>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:24px">
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Total Students</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:var(--color-text);margin-top:4px">${customers.length}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Active Subscriptions</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:var(--color-success);margin-top:4px">${customers.filter(c => c.sub_status === 'active').length}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Pending / Unsubscribed</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:${customers.filter(c => c.sub_status === 'pending').length > 0 ? '#ea580c' : 'var(--color-text-muted)'};margin-top:4px">${customers.filter(c => c.sub_status !== 'active').length}</div>
        </div>
      </div>

      <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
          <span class="icon">👥</span> Student Roster (${customers.length})
        </div>
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
                  <td style="font-size:0.78rem;font-family:monospace;color:var(--color-text-muted)"><code>${c.customer_id}</code></td>
                  <td><strong>${escapeHtml(c.name)}</strong></td>
                  <td>${escapeHtml(c.residence)}</td>
                  <td>${escapeHtml(c.vendor_name || '—')}</td>
                  <td>${escapeHtml(c.plan_name || '—')}</td>
                  <td>
                    ${c.sub_status === 'pending' ? `
                      <span class="badge" style="background:#fed7aa;color:#c2410c;font-weight:700">Pending Approval</span>
                    ` : `<span class="badge badge-${c.sub_status}">${c.sub_status}</span>`}
                  </td>
                  <td>
                    <span class="badge ${c.user_status === 'active' ? 'badge-active' : 'badge-pending'}" style="font-weight:700">
                      ${c.user_status ? (c.user_status.charAt(0).toUpperCase() + c.user_status.slice(1)) : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                      ${c.sub_status === 'pending' && c.sub_id ? `
                        <button class="btn btn-primary btn-sm" style="background:var(--color-success);border-color:var(--color-success);padding:3px 10px;font-size:0.75rem;font-weight:700"
                          onclick="handleAdminApproveSubFromCust('${c.sub_id}', '${escapeHtml(c.name)}')">
                          ✓ Approve Sub
                        </button>
                        <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:3px 8px;font-size:0.75rem"
                          onclick="handleAdminRejectSubFromCust('${c.sub_id}', '${escapeHtml(c.name)}')">
                          ✕ Reject Sub
                        </button>
                      ` : ''}
                      ${c.user_status === 'active' ? `
                        <button class="btn btn-outline btn-sm" style="color:var(--color-warning);border-color:var(--color-warning);padding:3px 8px;font-size:0.75rem;font-weight:600"
                          onclick="handleToggleCustomerStatus('${c.user_id}', 'suspended', '${escapeHtml(c.name)}')">
                          ⏸ Suspend
                        </button>
                      ` : (c.user_status === 'inactive' ? `
                        <button class="btn btn-primary btn-sm" style="background:var(--color-success);border-color:var(--color-success);padding:3px 10px;font-size:0.75rem;font-weight:700"
                          onclick="handleApproveCustomer('${c.user_id}', '${escapeHtml(c.name)}')">
                          ✓ Approve
                        </button>
                      ` : `
                        <button class="btn btn-outline btn-sm" style="color:var(--color-success);border-color:var(--color-success);padding:3px 8px;font-size:0.75rem;font-weight:600"
                          onclick="handleToggleCustomerStatus('${c.user_id}', 'active', '${escapeHtml(c.name)}')">
                          ✓ Unsuspend
                        </button>
                      `)}
                      <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:3px 8px;font-size:0.75rem;font-weight:600"
                        onclick="handleDeleteUser('${c.user_id}', '${escapeHtml(c.name)}')">
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

async function handleApproveCustomer(userId, userName) {
  try {
    await approveUser(userId);
    showToast('Customer Approved', `${userName} is now approved and active!`, 'success');
    renderAdminCustomers();
  } catch (err) {
    showToast('Error', err.message, 'error');
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

async function handleAdminApproveSubFromCust(subId, studentName) {
  if (!confirm(`Approve and activate Cash-on-Delivery subscription #${subId} for ${studentName}?`)) {
    return;
  }
  try {
    const res = await adminApproveSubscription(subId);
    showToast('Subscription Approved', res.message || `Subscription #${subId} activated!`, 'success');
    renderAdminCustomers();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function handleAdminRejectSubFromCust(subId, studentName) {
  if (!confirm(`Reject subscription request #${subId} for ${studentName}?`)) {
    return;
  }
  try {
    const res = await adminRejectSubscription(subId);
    showToast('Subscription Rejected', res.message || `Subscription #${subId} rejected.`, 'info');
    renderAdminCustomers();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function handleAdminPurgeDummyFromCustomers() {
  if (!confirm('Warning: This will permanently delete dummy test students (@tiffintrack.demo) and spam complaints. Real user accounts will be kept. Proceed?')) {
    return;
  }
  try {
    const res = await adminPurgeDummyData();
    showToast('Cleaned Up', res.message || 'Dummy accounts purged successfully!', 'success');
    renderAdminCustomers();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}
