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
      <div class="page-header">
        <h1>📢 Complaint Resolution Panel</h1>
        <p>Platform-wide complaint review, arbitration, dispute resolution, and refunds</p>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Pending Review</div>
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
        <div class="card-title"><span class="icon">📢</span> All Tickets (${complaints.length})</div>
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
                  <td class="complaint-id">${c.complaint_id}</td>
                  <td><strong>${c.customer_name}</strong></td>
                  <td>${c.vendor_name}</td>
                  <td>${c.issue_type}</td>
                  <td>${formatDate(c.created_at)}</td>
                  <td>
                    <span class="badge ${c.status === 'resolved' ? 'badge-success' : (c.status === 'rejected' ? 'badge-cancelled' : 'badge-pending')}">
                      ${c.status}
                    </span>
                  </td>
                  <td>
                    ${(c.status === 'pending' || c.status === 'open') ? `
                      <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button class="btn btn-primary btn-sm" style="padding:2px 8px;font-size:0.75rem"
                          onclick="handleResolveComplaintModal('${c.complaint_id}', '${c.customer_name}')">
                          ✓ Resolve
                        </button>
                        <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:2px 8px;font-size:0.75rem"
                          onclick="handleRejectComplaintModal('${c.complaint_id}')">
                          ✕ Reject
                        </button>
                      </div>
                    ` : `
                      <span style="font-size:0.78rem;color:var(--color-text-muted)">Closed</span>
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
