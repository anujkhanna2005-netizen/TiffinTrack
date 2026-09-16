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
                  <th>Residence & Room</th>
                  <th>Meal Add-ons & Prefs</th>
                  <th>Plan</th>
                  <th>Amount Due</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${activeList.map(s => {
                  let prefBadge = '';
                  const bread = s.bread_preference || (s.customer ? s.customer.bread_preference : 'standard');
                  const spice = s.spice_level || (s.customer ? s.customer.spice_level : 'medium');
                  const notes = (s.special_instructions || (s.customer ? s.customer.special_instructions : '') || '').slice(0, 200).trim();

                  if (bread === 'extra_roti') {
                    prefBadge += '<span class="badge" style="background:#fff3e0;color:#e65100;font-weight:700;margin-right:4px">🍞 +1 Extra Roti</span>';
                  } else if (bread === 'rice_only') {
                    prefBadge += '<span class="badge" style="background:#e8f5e9;color:#2e7d32;margin-right:4px">🍚 Rice Only</span>';
                  } else {
                    prefBadge += '<span class="badge" style="background:var(--color-surface-hover);color:var(--color-text-muted);margin-right:4px">🍞 Std Roti</span>';
                  }

                  if (spice === 'high') {
                    prefBadge += '<span class="badge" style="background:#ffebee;color:#c62828;font-weight:600">🌶️ High</span>';
                  } else if (spice === 'low') {
                    prefBadge += '<span class="badge" style="background:#e0f2f1;color:#00695c">🌶️ Mild</span>';
                  } else if (spice === 'jain') {
                    prefBadge += '<span class="badge" style="background:#f3e5f5;color:#6a1b9a">🌱 Jain</span>';
                  }

                  if (notes) {
                    prefBadge += `<div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:2px;font-style:italic">"${escapeHtml(notes)}"</div>`;
                  }

                  return `
                  <tr>
                    <td style="font-size:0.78rem;color:var(--color-text-muted)">${s.sub_id}</td>
                    <td>
                      <strong>${escapeHtml(s.customer ? s.customer.name : '—')}</strong>
                      <div style="font-size:0.75rem;color:var(--color-text-muted)">${escapeHtml(s.customer ? s.customer.phone : '')}</div>
                    </td>
                    <td>${escapeHtml(s.customer ? `${s.customer.residence}, Rm ${s.customer.room}` : '—')}</td>
                    <td>${prefBadge}</td>
                    <td>${escapeHtml(s.plan ? s.plan.name : '—')}</td>
                    <td><strong>${s.payment ? formatINR(s.payment.amount_due) : (s.plan ? formatINR(s.plan.price) : '—')}</strong></td>
                    <td>
                      <span class="badge ${s.payment && s.payment.status === 'collected' ? 'badge-success' : 'badge-pending'}">
                        ${s.payment && s.payment.status === 'collected' ? '✓ Collected' : '⏳ Pending Cash'}
                      </span>
                    </td>
                    <td>
                      ${s.payment && s.payment.status !== 'collected' && s.payment.payment_id ? `
                        <button class="btn btn-sm btn-primary" style="padding:3px 8px;font-size:0.75rem;background:var(--color-success);border-color:var(--color-success)"
                          onclick="handleMarkPaymentCollected('${s.payment.payment_id}', '${s.customer ? escapeHtml(s.customer.name) : 'Student'}')">
                          💵 Mark Collected
                        </button>
                      ` : `<span style="font-size:0.75rem;color:var(--color-text-muted)">Settled</span>`}
                    </td>
                  </tr>
                `;}).join('')}
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

async function handleMarkPaymentCollected(paymentId, studentName) {
  if (!confirm(`Confirm cash / direct payment collection from ${studentName}?`)) return;
  try {
    const res = await apiFetch(`/vendor/payment/${paymentId}/collect`, { method: 'PATCH' });
    showToast('Payment Collected', `Cash payment from ${studentName} marked as collected!`, 'success');
    renderVendorSubscribers();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

