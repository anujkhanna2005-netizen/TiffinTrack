// ============================================================
// TiffinTrack - Admin Complaints Page
// public/js/pages/adminComplaints.js
// ============================================================

async function renderAdminComplaints() {
  showLoading();
  try {
    const data = await getAdminData();
    const complaints = data.complaint_overview;

    const pending    = complaints.filter(c => c.status === 'pending' || c.status === 'open').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress' || c.status === 'in_review').length;
    const resolved   = complaints.filter(c => c.status === 'resolved').length;

    showContent(`
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Platform Command Center</span>
            <span style="font-size:0.8rem;color:var(--color-text-muted)">• Dispute Arbitration</span>
          </div>
          <h1 style="font-size:1.6rem;font-weight:800;color:var(--color-text);margin:0">📢 Complaint Resolution Panel</h1>
          <p style="color:var(--color-text-muted);margin-top:4px;font-size:0.88rem">Platform-wide complaint review, arbitration, dispute resolution, and refunds</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="renderAdminComplaints()" style="display:flex;align-items:center;gap:6px">
          ↺ Refresh Tickets
        </button>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:24px">
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Pending Review</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:var(--color-warning);margin-top:4px">${pending}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">In Progress / Investigation</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:var(--color-info);margin-top:4px">${inProgress}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Resolved & Settled</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:var(--color-success);margin-top:4px">${resolved}</div>
        </div>
      </div>

      <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
          <span class="icon">📢</span> Grievance Arbitration Tickets (${complaints.length})
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Student</th>
                <th>Vendor</th>
                <th>Issue</th>
                <th>Date</th>
                <th>Status</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              ${complaints.map(c => `
                <tr>
                  <td class="complaint-id" style="font-family:monospace;font-size:0.8rem"><code>${c.complaint_id}</code></td>
                  <td><strong>${escapeHtml(c.customer_name)}</strong></td>
                  <td>${escapeHtml(c.vendor_name)}</td>
                  <td><span class="badge badge-info" style="font-weight:600">${escapeHtml(c.issue_type)}</span></td>
                  <td style="font-size:0.82rem;color:var(--color-text-muted)">${formatDate(c.created_at)}</td>
                  <td>
                    <span class="badge ${c.status === 'resolved' ? 'badge-success' : (c.status === 'rejected' ? 'badge-cancelled' : 'badge-pending')}" style="font-weight:700">
                      ${c.status}
                    </span>
                  </td>
                  <td>
                    ${(c.status === 'pending' || c.status === 'open') ? `
                      <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button class="btn btn-primary btn-sm" style="background:var(--color-success);border-color:var(--color-success);padding:3px 10px;font-size:0.75rem;font-weight:700"
                          onclick="handleResolveComplaintModal('${c.complaint_id}', '${escapeHtml(c.customer_name)}')">
                          ✓ Resolve
                        </button>
                        <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:3px 8px;font-size:0.75rem"
                          onclick="handleRejectComplaintModal('${c.complaint_id}')">
                          ✕ Reject
                        </button>
                      </div>
                    ` : `
                      <span style="font-size:0.78rem;color:var(--color-text-muted);font-weight:600">✓ Closed</span>
                    `}
                  </td>
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

async function handleResolveComplaintModal(complaintId, studentName) {
  const notes = prompt(`Enter resolution notes for Ticket #${complaintId} (Student: ${studentName}):`, 'Refund/Credit issued for meal and vendor warned.');
  if (notes === null) return;

  try {
    await resolveComplaint(complaintId, notes);
    showToast('Resolved', `Ticket #${complaintId} marked as Resolved.`, 'success');
    renderAdminComplaints();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function handleRejectComplaintModal(complaintId) {
  const reason = prompt(`Enter rejection reason for Ticket #${complaintId}:`, 'Insufficient evidence or outside policy window.');
  if (reason === null) return;

  try {
    await rejectComplaint(complaintId, reason);
    showToast('Rejected', `Ticket #${complaintId} has been rejected.`, 'info');
    renderAdminComplaints();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}
