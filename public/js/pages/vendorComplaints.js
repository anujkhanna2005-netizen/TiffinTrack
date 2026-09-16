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
      <div class="page-header" style="margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Kitchen Operations</span>
          <span style="font-size:0.8rem;color:var(--color-text-muted)">• Customer Support</span>
        </div>
        <h1 style="font-size:1.6rem;font-weight:800;color:var(--color-text);margin:0">📢 Student Feedback & Complaints</h1>
        <p style="color:var(--color-text-muted);margin-top:4px;font-size:0.88rem">${data.vendor ? escapeHtml(data.vendor.name) : 'Kitchen'} — Grievance management and resolution tracker</p>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:24px">
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.85rem">Pending Review</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:var(--color-warning);margin-top:4px">${pending}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.85rem">In Progress / Review</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:var(--color-info);margin-top:4px">${inProgress}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.85rem">Resolved & Closed</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:var(--color-success);margin-top:4px">${resolved}</div>
        </div>
      </div>

      <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
          <span class="icon">📢</span> Grievance Roster (${complaints.length})
        </div>
        ${complaints.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>Ticket ID</th><th>Student</th><th>Issue Category</th><th>Description</th><th>Reported Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${complaints.map(c => `
                  <tr>
                    <td class="complaint-id" style="font-family:monospace;font-size:0.8rem"><code>${c.complaint_id}</code></td>
                    <td><strong>${escapeHtml(c.customer_name)}</strong></td>
                    <td><span class="badge badge-info" style="font-weight:600">${escapeHtml(c.issue_type)}</span></td>
                    <td style="font-size:0.85rem;max-width:260px;color:var(--color-text-muted)">${escapeHtml(c.description)}</td>
                    <td style="font-size:0.82rem;color:var(--color-text-muted)">${formatDate(c.created_at)}</td>
                    <td><span class="badge badge-${c.status}" style="font-weight:700">${c.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state" style="padding:48px 16px">
            <div class="empty-icon" style="font-size:2.5rem;margin-bottom:8px">✅</div>
            <h3 style="font-size:1.1rem;font-weight:700">No Complaints</h3>
            <p style="font-size:0.85rem;color:var(--color-text-muted)">No student complaints have been submitted for your service.</p>
          </div>
        `}
      </div>
    `);
  } catch (err) {
    showError('Failed to load complaints: ' + err.message);
  }
}
