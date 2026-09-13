// ============================================================
// TiffinTrack - Admin Complaints Page
// public/js/pages/adminComplaints.js
// ============================================================

async function renderAdminComplaints() {
  showLoading();
  try {
    const data = await getAdminData();
    const complaints = data.complaint_overview;

    const pending    = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved   = complaints.filter(c => c.status === 'resolved').length;

    showContent(`
      <div class="page-header">
        <h1>📢 Complaints</h1>
        <p>Platform-wide complaint management</p>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Pending</div>
          <div class="stat-value" style="color:var(--color-warning)">${pending}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">In Progress</div>
          <div class="stat-value" style="color:var(--color-info)">${inProgress}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Resolved</div>
          <div class="stat-value" style="color:var(--color-success)">${resolved}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span class="icon">📢</span> All Complaints (${complaints.length})</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>Student</th><th>Vendor</th><th>Issue</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${complaints.map(c => `
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
    showError('Failed to load complaints: ' + err.message);
  }
}
