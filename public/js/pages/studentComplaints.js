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
      <div class="max-w-6xl mx-auto py-2 flex flex-col gap-6">
        
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span class="material-symbols-outlined text-[14px]">support_agent</span>
              Student Support & Dispute Resolution
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Complaints & Issue Reporting
            </h1>
            <p class="text-slate-500 text-sm mt-1 max-w-xl">
              Report quality anomalies, late deliveries, or missing items. Every ticket is logged for administrative review and vendor audit.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Submit Form (6 cols) -->
          <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-purple-600 text-[20px]">edit_document</span>
                File a Grievance Ticket
              </h3>
              <span class="text-xs text-slate-400">24-48h Resolution</span>
            </div>

            <div id="complaint-alert"></div>

            ${!subscription ? '<div class="alert alert-warning text-xs">You need an active subscription to submit a formal ticket.</div>' : ''}

            <div>
              <label for="issue-type" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Anomaly Category</label>
              <select id="issue-type" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" ${!subscription ? 'disabled' : ''}>
                <option value="">-- Select Category --</option>
                <option>Late Delivery</option>
                <option>Missing Item</option>
                <option>Poor Taste</option>
                <option>Food Quality / Hygiene</option>
                <option>Wrong Meal</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label for="complaint-desc" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Detailed Description</label>
              <textarea id="complaint-desc" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" placeholder="Specify details (e.g. food was cold on delivery, extra roti missing, delayed past 1:30 PM)..." rows="4" ${!subscription ? 'disabled' : ''}></textarea>
            </div>

            <button class="btn btn-primary btn-sm text-xs font-bold w-full" onclick="submitComplaintForm('${subscription ? subscription.vendor_id : ''}')"
              id="btn-submit-complaint" ${!subscription ? 'disabled' : ''}>
              Submit Complaint Ticket
            </button>
          </div>

          <!-- Complaint History (6 cols) -->
          <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-700 text-[20px]">history</span>
                Ticket History (${myComplaints.length})
              </h3>
              <span class="text-xs text-slate-400">Campus Oversight</span>
            </div>

            ${myComplaints.length > 0 ? `
              <div class="space-y-3">
                ${myComplaints.map(c => `
                  <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div class="flex justify-between items-center text-xs">
                      <span class="font-mono font-bold text-slate-700">#${c.complaint_id}</span>
                      <span class="badge badge-${c.status}">${c.status}</span>
                    </div>
                    <div class="text-sm font-bold text-slate-900">${c.issue_type}</div>
                    <div class="text-xs text-slate-600 leading-relaxed">${c.description}</div>
                    <div class="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 flex justify-between">
                      <span>${c.vendor ? c.vendor.name : 'Vendor Kitchen'}</span>
                      <span>${formatDate(c.created_at)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span class="material-symbols-outlined text-emerald-600 text-4xl mb-1">verified_user</span>
                <div class="font-bold text-slate-700">No active grievances</div>
                <div class="text-slate-400 mt-0.5">You have zero open complaint tickets.</div>
              </div>
            `}
          </div>

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
