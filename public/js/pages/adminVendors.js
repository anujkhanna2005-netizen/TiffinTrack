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
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Platform Command Center</span>
            <span style="font-size:0.8rem;color:var(--color-text-muted)">• Vendor Oversight</span>
          </div>
          <h1 style="font-size:1.6rem;font-weight:800;color:var(--color-text);margin:0">🏪 Vendors Management</h1>
          <p style="color:var(--color-text-muted);margin-top:4px;font-size:0.88rem">Manage, approve, activate, suspend, or disable vendors on the TiffinTrack platform</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="renderAdminVendors()" style="display:flex;align-items:center;gap:6px">
          ↺ Refresh Vendors
        </button>
      </div>

      <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
          <span class="icon">🏪</span> Vendor Directory (${vendors.length})
        </div>
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
                  <td style="font-size:0.78rem;font-family:monospace;color:var(--color-text-muted)"><code>${v.vendor_id}</code></td>
                  <td><strong>${escapeHtml(v.name)}</strong></td>
                  <td>${escapeHtml(v.locality)}</td>
                  <td>${v.overall_rating ? '⭐ ' + v.overall_rating.toFixed(1) : '<span style="color:var(--color-text-muted)">No ratings</span>'}</td>
                  <td><strong>${v.active_subscribers}</strong></td>
                  <td>${v.today_deliveries}</td>
                  <td>
                    <span class="${v.pending_complaints > 0 ? 'badge badge-pending' : 'badge badge-success'}" style="font-weight:700">
                      ${v.pending_complaints} pending
                    </span>
                  </td>
                  <td>
                    <span class="badge ${v.status === 'active' ? 'badge-active' : (v.status === 'suspended' ? 'badge-pending' : 'badge-cancelled')}" style="font-weight:700">
                      ${v.status ? (v.status.charAt(0).toUpperCase() + v.status.slice(1)) : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                      ${v.status === 'active' ? `
                        <button class="btn btn-outline btn-sm" style="color:var(--color-warning);border-color:var(--color-warning);padding:4px 10px;font-size:0.75rem;font-weight:600"
                          onclick="handleToggleVendorStatus('${v.vendor_id}', 'suspended', '${escapeHtml(v.name)}')">
                          ⏸ Suspend
                        </button>
                      ` : (v.status === 'inactive' ? `
                        <button class="btn btn-primary btn-sm" style="background:var(--color-success);border-color:var(--color-success);padding:4px 10px;font-size:0.75rem;font-weight:700"
                          onclick="handleToggleVendorStatus('${v.vendor_id}', 'active', '${escapeHtml(v.name)}')">
                          ✓ Approve
                        </button>
                      ` : `
                        <button class="btn btn-outline btn-sm" style="color:var(--color-success);border-color:var(--color-success);padding:4px 10px;font-size:0.75rem;font-weight:600"
                          onclick="handleToggleVendorStatus('${v.vendor_id}', 'active', '${escapeHtml(v.name)}')">
                          ✓ Unsuspend
                        </button>
                      `)}
                      <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:4px 10px;font-size:0.75rem;font-weight:600"
                        onclick="handleDeleteVendor('${v.vendor_id}', '${escapeHtml(v.name)}')">
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
