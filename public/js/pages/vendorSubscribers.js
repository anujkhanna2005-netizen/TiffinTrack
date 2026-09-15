// ============================================================
// TiffinTrack - Vendor Subscribers & Approvals Page
// public/js/pages/vendorSubscribers.js
// ============================================================

async function renderVendorSubscribers() {
  showLoading();
  try {
    const data = await getVendorData();
    const { subscribers, stats } = data;

    const activeList  = subscribers.filter(s => s.status === 'active');
    const pendingList = subscribers.filter(s => s.status === 'pending' || s.status === 'paused');

    showContent(`
      <div class="page-header">
        <h1>👥 Subscribers & Subscription Requests</h1>
        <p>Review student subscription applications, manage active diners, and track plans</p>
      </div>

      <!-- Stats Summary -->
      <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Active Subscribers</div>
          <div class="stat-value">${activeList.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Approvals</div>
          <div class="stat-value" style="color:${pendingList.length > 0 ? 'var(--color-warning)' : 'var(--color-success)'}">
            ${pendingList.length}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Monthly Revenue</div>
          <div class="stat-value" style="font-size:1.1rem;margin-top:6px">
            Est. ${formatINR(activeList.reduce((acc, s) => acc + (s.plan ? s.plan.price : 0), 0))}
          </div>
        </div>
      </div>

      <!-- Pending Approval Section -->
      ${pendingList.length > 0 ? `
        <div class="card" style="margin-bottom:20px;border-left:4px solid var(--color-warning)">
          <div class="card-title"><span class="icon">⏳</span> Pending Subscription Requests (${pendingList.length})</div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Residence & Room</th>
                  <th>Phone</th>
                  <th>Plan Requested</th>
                  <th>Price</th>
                  <th>Date</th>
                  <th>Vendor Actions</th>
                </tr>
              </thead>
              <tbody>
                ${pendingList.map(s => `
                  <tr>
                    <td><strong>${s.customer ? s.customer.name : 'Student'}</strong></td>
                    <td>${s.customer ? `${s.customer.residence}, Room ${s.customer.room}` : '—'}</td>
                    <td>${s.customer ? s.customer.phone : '—'}</td>
                    <td><span class="badge badge-info">${s.plan ? s.plan.name : 'Standard'}</span></td>
                    <td><strong>${s.plan ? formatINR(s.plan.price) : '—'}</strong></td>
                    <td>${formatDate(s.start_date)}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" style="padding:3px 10px;font-size:0.75rem"
                          onclick="handleApproveSubscription('${s.sub_id}', '${s.customer ? s.customer.name : 'Student'}')">
                          ✓ Approve
                        </button>
                        <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:3px 10px;font-size:0.75rem"
                          onclick="handleRejectSubscription('${s.sub_id}')">
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Active Subscribers Table -->
      <div class="card">
        <div class="card-title"><span class="icon">👥</span> Active Subscriber Roster (${activeList.length})</div>
        ${activeList.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Sub ID</th>
                  <th>Student Name</th>
                  <th>Residence</th>
                  <th>Room</th>
                  <th>Contact</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Renewal Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${activeList.map(s => `
                  <tr>
                    <td style="font-size:0.78rem;color:var(--color-text-muted)">${s.sub_id}</td>
                    <td><strong>${s.customer ? s.customer.name : '—'}</strong></td>
                    <td>${s.customer ? s.customer.residence : '—'}</td>
                    <td>${s.customer ? s.customer.room : '—'}</td>
                    <td>${s.customer ? s.customer.phone : '—'}</td>
                    <td>${s.plan ? s.plan.name : '—'}</td>
                    <td>${s.plan ? formatINR(s.plan.price) : '—'}</td>
                    <td>${formatDate(s.end_date)}</td>
                    <td><span class="badge badge-${s.status}">${s.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<div class="empty-state"><div class="empty-icon">👥</div><p>No active subscribers yet.</p></div>`}
      </div>
    `);
  } catch (err) {
    showError('Failed to load subscribers: ' + err.message);
  }
}

async function handleApproveSubscription(subId, studentName) {
  try {
    const res = await apiFetch(`/vendor/subscription/${subId}/approve`, { method: 'PATCH' });
    showToast('Approved!', `Subscription for ${studentName} is now active.`, 'success');
    renderVendorSubscribers();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function handleRejectSubscription(subId) {
  if (!confirm('Reject this subscription request?')) return;
  try {
    const res = await apiFetch(`/vendor/subscription/${subId}/reject`, { method: 'PATCH' });
    showToast('Rejected', 'Subscription request was rejected.', 'info');
    renderVendorSubscribers();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}
