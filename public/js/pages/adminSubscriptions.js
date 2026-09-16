// ============================================================
// TiffinTrack - Admin Subscriptions Management Page
// public/js/pages/adminSubscriptions.js
// ============================================================

async function renderAdminSubscriptions() {
  showLoading();
  try {
    const [subs, adminData] = await Promise.all([
      getAdminSubscriptions(),
      getAdminData()
    ]);

    const pendingSubs = (subs || []).filter(s => s.status === 'pending');
    const activeSubs = (subs || []).filter(s => s.status === 'active');
    const pastSubs = (subs || []).filter(s => s.status !== 'pending' && s.status !== 'active');

    const totalRevenue = activeSubs.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);

    showContent(`
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Platform Command Center</span>
            <span style="font-size:0.8rem;color:var(--color-text-muted)">• Subscriptions Hub</span>
          </div>
          <h1 style="font-size:1.6rem;font-weight:800;color:var(--color-text);margin:0">📋 Subscription Approvals & Directory</h1>
          <p style="color:var(--color-text-muted);margin-top:4px;font-size:0.88rem">Review student subscription applications, execute platform-wide admin approvals, and monitor diner meals</p>
        </div>
        <div>
          <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);font-weight:600;padding:8px 14px" onclick="handleAdminPurgeDummy()">
            🧹 Purge Dummy/Spam Data
          </button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px">
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Pending Approval Requests</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:${pendingSubs.length > 0 ? '#ea580c' : 'var(--color-text)'};margin-top:4px">
            ${pendingSubs.length}
          </div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Active Diners</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:var(--color-success);margin-top:4px">${activeSubs.length}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Active Monthly Value</div>
          <div class="stat-value" style="font-size:1.6rem;font-weight:800;color:var(--color-primary);margin-top:4px">${formatINR(totalRevenue)}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Total Historical Requests</div>
          <div class="stat-value" style="font-size:2rem;font-weight:800;color:var(--color-text);margin-top:4px">${subs.length}</div>
        </div>
      </div>

      <!-- Section 1: Pending Requests Queue -->
      <div class="card" style="margin-bottom:24px; border-left:4px solid var(--color-primary); background:var(--color-surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin-bottom:0;font-size:1.1rem;font-weight:800;color:var(--color-primary)">
            <span class="icon">⏳</span> Pending Subscription Requests (${pendingSubs.length})
          </div>
          <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Platform Tie-up Authority</span>
        </div>

        ${pendingSubs.length === 0 ? `
          <div style="text-align:center;padding:36px 16px;color:var(--color-text-muted)">
            <div style="font-size:2.2rem;margin-bottom:8px">🎉</div>
            <strong style="color:var(--color-text);font-size:1rem">All subscription requests have been reviewed!</strong>
            <p style="font-size:0.85rem;margin-top:4px">New student Cash-on-Delivery requests will automatically appear here for approval.</p>
          </div>
        ` : `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Sub ID</th>
                  <th>Student Details</th>
                  <th>Residence & Room</th>
                  <th>Vendor Kitchen</th>
                  <th>Meal Plan</th>
                  <th>Amount Due (COD)</th>
                  <th>Requested Date</th>
                  <th>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                ${pendingSubs.map(s => `
                  <tr id="admin-sub-row-${s.sub_id}">
                    <td style="font-size:0.78rem;font-family:monospace;color:var(--color-text-muted)"><code>${s.sub_id}</code></td>
                    <td>
                      <strong>${escapeHtml(s.customer_name)}</strong><br>
                      <small style="color:var(--color-text-muted)">📞 ${escapeHtml(s.customer_phone || '—')}</small>
                    </td>
                    <td>${escapeHtml(s.pg_or_flat_name || 'Campus')}, Rm ${escapeHtml(s.room_no || '—')}</td>
                    <td><strong>${escapeHtml(s.vendor_name)}</strong></td>
                    <td><span class="badge badge-info">${escapeHtml(s.plan_name)}</span></td>
                    <td><strong style="color:var(--color-primary)">${formatINR(s.amount_due || s.price)}</strong></td>
                    <td style="font-size:0.8rem;color:var(--color-text-muted)">${formatDate(s.start_date)}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" style="background:var(--color-success);border-color:var(--color-success);padding:5px 12px;font-size:0.8rem;font-weight:700"
                          onclick="handleAdminApproveSub('${s.sub_id}', '${escapeHtml(s.customer_name)}')">
                          ✓ Approve
                        </button>
                        <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:5px 10px;font-size:0.8rem"
                          onclick="handleAdminRejectSub('${s.sub_id}', '${escapeHtml(s.customer_name)}')">
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Section 2: Active & Historical Subscriptions -->
      <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
          <span class="icon">📜</span> Platform Subscriptions Directory (${activeSubs.length + pastSubs.length})
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Sub ID</th>
                <th>Student</th>
                <th>Vendor</th>
                <th>Meal Plan</th>
                <th>Locked Price</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Validity Period</th>
              </tr>
            </thead>
            <tbody>
              ${[...activeSubs, ...pastSubs].map(s => `
                <tr>
                  <td style="font-size:0.78rem;font-family:monospace;color:var(--color-text-muted)"><code>${s.sub_id}</code></td>
                  <td><strong>${escapeHtml(s.customer_name)}</strong></td>
                  <td>${escapeHtml(s.vendor_name)}</td>
                  <td>${escapeHtml(s.plan_name)}</td>
                  <td><strong>${formatINR(s.price)}</strong></td>
                  <td><span class="badge" style="background:#e0e7ff;color:#3730a3;font-weight:700">COD</span></td>
                  <td>${subscriptionStatusBadge(s.status)}</td>
                  <td style="font-size:0.8rem;color:var(--color-text-muted)">
                    ${s.approved_by ? `<span class="badge" style="background:#f1f5f9;color:#334155;font-weight:600">${s.approved_by.toUpperCase()}</span>` : '—'}
                  </td>
                  <td style="font-size:0.8rem;color:var(--color-text-muted)">
                    ${formatDate(s.start_date)} → ${formatDate(s.end_date)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load subscriptions: ' + err.message);
  }
}

// Handler: Admin Approves Subscription
async function handleAdminApproveSub(subId, studentName) {
  if (!confirm(`Are you sure you want to APPROVE and ACTIVATE subscription #${subId} for ${studentName}?`)) {
    return;
  }
  try {
    const res = await adminApproveSubscription(subId);
    showToast(res.message || `Subscription #${subId} approved successfully!`, 'success');
    if (typeof renderAdminSubscriptions === 'function') renderAdminSubscriptions();
    if (typeof renderAdminDashboard === 'function' && currentRole === 'admin') renderAdminDashboard();
  } catch (err) {
    showToast('Failed to approve subscription: ' + err.message, 'error');
  }
}

// Handler: Admin Rejects Subscription
async function handleAdminRejectSub(subId, studentName) {
  if (!confirm(`Are you sure you want to REJECT subscription #${subId} for ${studentName}?`)) {
    return;
  }
  try {
    const res = await adminRejectSubscription(subId);
    showToast(res.message || `Subscription #${subId} rejected.`, 'info');
    if (typeof renderAdminSubscriptions === 'function') renderAdminSubscriptions();
    if (typeof renderAdminDashboard === 'function' && currentRole === 'admin') renderAdminDashboard();
  } catch (err) {
    showToast('Failed to reject subscription: ' + err.message, 'error');
  }
}

// Handler: Purge Dummy Data
async function handleAdminPurgeDummy() {
  if (!confirm('Warning: This will permanently delete dummy seed accounts (@tiffintrack.demo) and dummy test complaints. Genuine user accounts and vendors will be preserved. Proceed?')) {
    return;
  }
  try {
    const res = await adminPurgeDummyData();
    showToast(res.message || 'Dummy test data cleaned up successfully!', 'success');
    if (typeof renderAdminSubscriptions === 'function') renderAdminSubscriptions();
  } catch (err) {
    showToast('Purge failed: ' + err.message, 'error');
  }
}
