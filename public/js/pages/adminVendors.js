// ============================================================
// TiffinTrack - Admin Vendors Page
// public/js/pages/adminVendors.js
// ============================================================

async function renderAdminVendors() {
  showLoading();
  try {
    const data = await getAdminData();
    const vendors = data.vendor_performance;

    showContent(`
      <div class="page-header">
        <h1>🏪 Vendors Management</h1>
        <p>Manage, approve, activate, suspend, or disable vendors on the TiffinTrack platform</p>
      </div>

      <div class="card">
        <div class="card-title"><span class="icon">🏪</span> Vendor Directory (${vendors.length})</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vendor Name</th>
                <th>Location</th>
                <th>Rating</th>
                <th>Subscribers</th>
                <th>Deliveries Today</th>
                <th>Complaints</th>
                <th>Status</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              ${vendors.map(v => `
                <tr>
                  <td style="font-size:0.78rem;color:var(--color-text-muted)">${v.vendor_id}</td>
                  <td><strong>${v.name}</strong></td>
                  <td>${v.locality}</td>
                  <td>${v.overall_rating ? '⭐ ' + v.overall_rating.toFixed(1) : 'No ratings'}</td>
                  <td>${v.active_subscribers}</td>
                  <td>${v.today_deliveries}</td>
                  <td>
                    <span class="${v.pending_complaints > 0 ? 'badge badge-pending' : 'badge badge-success'}">
                      ${v.pending_complaints} pending
                    </span>
                  </td>
                  <td>
                    <span class="badge ${v.status === 'active' ? 'badge-active' : (v.status === 'suspended' ? 'badge-pending' : 'badge-cancelled')}">
                      ${v.status ? (v.status.charAt(0).toUpperCase() + v.status.slice(1)) : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                      ${v.status === 'active' ? `
                        <button class="btn btn-outline btn-sm" style="color:var(--color-warning);border-color:var(--color-warning);padding:3px 8px;font-size:0.75rem"
                          onclick="handleToggleVendorStatus('${v.vendor_id}', 'suspended', '${v.name}')">
                          ⏸ Suspend
                        </button>
                      ` : `
                        <button class="btn btn-outline btn-sm" style="color:var(--color-success);border-color:var(--color-success);padding:3px 8px;font-size:0.75rem"
                          onclick="handleToggleVendorStatus('${v.vendor_id}', 'active', '${v.name}')">
                          ✓ Activate
                        </button>
                      `}
                      <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:3px 8px;font-size:0.75rem"
                        onclick="handleDeleteVendor('${v.vendor_id}', '${v.name}')">
                        🗑 Disable
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
    showError('Failed to load vendors: ' + err.message);
  }
}

async function handleToggleVendorStatus(vendorId, newStatus, vendorName) {
  try {
    await updateVendorStatus(vendorId, newStatus);
    showToast('Status Updated', `${vendorName} is now ${newStatus}.`, 'success');
    renderAdminVendors();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function handleDeleteVendor(vendorId, vendorName) {
  if (!confirm(`Are you sure you want to disable and unlist "${vendorName}" (${vendorId})? All active subscriptions will be cancelled.`)) {
    return;
  }
  try {
    await deleteVendor(vendorId);
    showToast('Vendor Disabled', `${vendorName} has been deactivated.`, 'success');
    renderAdminVendors();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}
