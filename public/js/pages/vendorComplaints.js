// ============================================================
// TiffinTrack - Vendor Complaints Page
// public/js/pages/vendorComplaints.js
// ============================================================

async function renderVendorComplaints() {
  showLoading();
  try {
    const data = await getVendorData();
    const complaints = data.complaints;

    const pending    = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved   = complaints.filter(c => c.status === 'resolved').length;

    showContent(`
      <div class="page-header">
        <h1>📢 Complaints</h1>
        <p>Annapurna Tiffin Services — student complaint management</p>
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
        <div class="card-title"><span class="icon">📢</span> All Complaints</div>
        ${complaints.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>Complaint ID</th><th>Student</th><th>Issue</th><th>Description</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${complaints.map(c => `
                  <tr>
                    <td class="complaint-id">${c.complaint_id}</td>
                    <td>${c.customer_name}</td>
                    <td><strong>${c.issue_type}</strong></td>
                    <td style="font-size:0.82rem;max-width:220px">${c.description}</td>
                    <td>${formatDate(c.created_at)}</td>
                    <td><span class="badge badge-${c.status}">${c.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <h3>No Complaints</h3>
            <p>No complaints have been submitted for your service.</p>
          </div>
        `}
      </div>
    `);
  } catch (err) {
    showError('Failed to load complaints: ' + err.message);
  }
}
