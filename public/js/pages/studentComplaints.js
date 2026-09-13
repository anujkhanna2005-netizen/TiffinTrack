// ============================================================
// TiffinTrack - Student Complaints Page
// public/js/pages/studentComplaints.js
// ============================================================

async function renderStudentComplaints() {
  showLoading();
  try {
    const [subscription, myComplaints] = await Promise.all([
      getSubscription(),
      getMyComplaints()
    ]);

    showContent(`
      <div class="page-header">
        <h1>📢 Complaints</h1>
        <p>Submit and track your complaints.</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <!-- Submit Form -->
        <div class="card">
          <div class="card-title"><span class="icon">✍️</span> Submit a Complaint</div>
          <div id="complaint-alert"></div>

          ${!subscription ? '<div class="alert alert-warning">You need an active subscription to submit a complaint.</div>' : ''}

          <div class="form-group">
            <label for="issue-type">Issue Type</label>
            <select id="issue-type" class="form-control" ${!subscription ? 'disabled' : ''}>
              <option value="">-- Select Issue --</option>
              <option>Late Delivery</option>
              <option>Missing Item</option>
              <option>Poor Taste</option>
              <option>Food Quality</option>
              <option>Wrong Meal</option>
              <option>Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="complaint-desc">Description</label>
            <textarea id="complaint-desc" class="form-control" placeholder="Describe your issue in detail..." rows="4" ${!subscription ? 'disabled' : ''}></textarea>
          </div>

          <button class="btn btn-primary" onclick="submitComplaintForm('${subscription ? subscription.vendor_id : ''}')"
            id="btn-submit-complaint" ${!subscription ? 'disabled' : ''}>
            Submit Complaint
          </button>
        </div>

        <!-- Complaint History -->
        <div class="card">
          <div class="card-title"><span class="icon">📋</span> My Complaints (${myComplaints.length})</div>
          ${myComplaints.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:12px">
              ${myComplaints.map(c => `
                <div style="border:1px solid var(--color-border);border-radius:var(--radius);padding:12px">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="complaint-id">${c.complaint_id}</span>
                    <span class="badge badge-${c.status}">${c.status}</span>
                  </div>
                  <div style="font-size:0.875rem;font-weight:600;margin-top:6px">${c.issue_type}</div>
                  <div style="font-size:0.82rem;color:var(--color-text-muted);margin-top:2px">${c.description}</div>
                  <div style="font-size:0.78rem;color:var(--color-text-light);margin-top:6px">
                    ${c.vendor ? c.vendor.name : ''} • ${formatDate(c.created_at)}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-icon">✅</div>
              <h3>No Complaints</h3>
              <p>You haven't submitted any complaints yet.</p>
            </div>
          `}
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load complaints: ' + err.message);
  }
}

async function submitComplaintForm(vendorId) {
  const issueType   = document.getElementById('issue-type').value;
  const description = document.getElementById('complaint-desc').value.trim();
  const alertDiv    = document.getElementById('complaint-alert');

  if (!issueType) {
    alertDiv.innerHTML = '<div class="alert alert-warning">Please select an issue type.</div>';
    return;
  }
  if (!description) {
    alertDiv.innerHTML = '<div class="alert alert-warning">Please describe the issue.</div>';
    return;
  }

  const btn = document.getElementById('btn-submit-complaint');
  btn.disabled = true;
  btn.textContent = 'Submitting...';
  alertDiv.innerHTML = '';

  try {
    const result = await submitComplaint(vendorId, issueType, description);
    alertDiv.innerHTML = `
      <div class="alert alert-success">
        ✅ Complaint submitted!<br>
        <strong>ID: ${result.complaint.complaint_id}</strong> • Status: Pending
      </div>
    `;
    // Reset form
    document.getElementById('issue-type').value = '';
    document.getElementById('complaint-desc').value = '';
    btn.disabled = false;
    btn.textContent = 'Submit Complaint';
    // Refresh complaint history
    setTimeout(() => renderStudentComplaints(), 1500);
  } catch (err) {
    alertDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
    btn.disabled = false;
    btn.textContent = 'Submit Complaint';
  }
}
