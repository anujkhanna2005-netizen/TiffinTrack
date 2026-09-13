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
        <h1>🏪 Vendors</h1>
        <p>All registered vendors on the TiffinTrack platform</p>
      </div>

      <div class="card">
        <div class="card-title"><span class="icon">🏪</span> Vendor Directory (${vendors.length})</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>Vendor Name</th><th>Location</th><th>Rating</th><th>Subscribers</th><th>Deliveries Today</th><th>Complaints</th><th>Status</th></tr>
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
                  <td><span class="badge badge-active">Active</span></td>
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
