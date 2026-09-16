// ============================================================
// TiffinTrack - Admin Dashboard
// public/js/pages/adminDashboard.js
// ============================================================

async function renderAdminDashboard() {
  showLoading();
  try {
    const data = await getAdminData();
    const { stats, vendor_performance, customer_activity, complaint_overview } = data;

    const pendingList = data.pending_subscriptions || [];

    showContent(`
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Platform Command Center</span>
            <span style="font-size:0.8rem;color:var(--color-text-muted)">• Admin Authority</span>
          </div>
          <h1 style="font-size:1.6rem;font-weight:800;color:var(--color-text);margin:0">🔧 System Control & Overview</h1>
          <p style="color:var(--color-text-muted);margin-top:4px;font-size:0.88rem">TiffinTrack Administrator — Platform Overview, Subscriptions & Approvals</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="navigateTo('adminSubscriptions')" style="display:flex;align-items:center;gap:6px;font-weight:700;padding:8px 16px">
            📋 Subscriptions Hub (${pendingList.length} Pending)
          </button>
          <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);font-weight:600;padding:8px 14px" onclick="handleAdminPurgeDummy()">
            🧹 Purge Dummy Data
          </button>
        </div>
      </div>

      <!-- Platform Stats -->
      <div class="stat-grid" style="grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:14px;margin-bottom:24px">
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Total Students</div>
          <div class="stat-value" style="font-size:1.8rem;font-weight:800;color:var(--color-text);margin-top:4px">${stats.total_students}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Total Vendors</div>
          <div class="stat-value" style="font-size:1.8rem;font-weight:800;color:var(--color-text);margin-top:4px">${stats.total_vendors}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Pending Requests</div>
          <div class="stat-value" style="font-size:1.8rem;font-weight:800;color:${pendingList.length > 0 ? '#ea580c' : 'var(--color-success)'};margin-top:4px">
            ${pendingList.length}
          </div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Active Subscriptions</div>
          <div class="stat-value" style="font-size:1.8rem;font-weight:800;color:var(--color-primary);margin-top:4px">${stats.active_subscriptions}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Today's Deliveries</div>
          <div class="stat-value" style="font-size:1.8rem;font-weight:800;color:var(--color-info);margin-top:4px">${stats.today_deliveries}</div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Pending Complaints</div>
          <div class="stat-value" style="font-size:1.8rem;font-weight:800;color:${stats.pending_complaints > 0 ? 'var(--color-danger)' : 'var(--color-success)'};margin-top:4px">
            ${stats.pending_complaints}
          </div>
        </div>
        <div class="stat-card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="stat-label" style="font-weight:600;font-size:0.82rem">Platform Avg Rating</div>
          <div class="stat-value" style="font-size:1.8rem;font-weight:800;color:var(--color-warning);margin-top:4px">⭐ ${stats.avg_rating ? stats.avg_rating.toFixed(1) : '—'}</div>
        </div>
      </div>

      <!-- Pending Verification & Approval Queue -->
      ${data.pending_approvals && data.pending_approvals.length > 0 ? `
        <div class="card" style="margin-bottom:24px;border-left:4px solid #ea580c;background:#fffaf0;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <div class="card-title" style="margin-bottom:0;color:#9a3412;font-size:1.1rem;font-weight:800">
              <span class="icon">🚨</span> Pending Registration Approvals (${data.pending_approvals.length})
            </div>
            <span class="badge" style="background:#fed7aa;color:#9a3412;font-weight:700">Action Required</span>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>Role</th><th>Name</th><th>Email</th><th>Phone</th><th>Locality</th><th>Registered</th><th>Admin Decision</th></tr>
              </thead>
              <tbody>
                ${data.pending_approvals.map(u => `
                  <tr id="pending-row-${u.user_id}">
                    <td><span class="badge badge-pending" style="font-weight:700">${u.role.toUpperCase()}</span></td>
                    <td><strong>${escapeHtml(u.name)}</strong></td>
                    <td>${escapeHtml(u.email)}</td>
                    <td>${escapeHtml(u.phone)}</td>
                    <td>${escapeHtml(u.locality)}</td>
                    <td style="font-size:0.8rem;color:var(--color-text-muted)">${formatDate(u.created_at)}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" style="background:var(--color-success);border-color:var(--color-success);padding:4px 12px;font-size:0.8rem;font-weight:700"
                          onclick="handleApproveUser('${u.user_id}', '${escapeHtml(u.name)}')">
                          ✓ Approve
                        </button>
                        <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:4px 8px;font-size:0.8rem"
                          onclick="handleRejectPendingUser('${u.user_id}', '${escapeHtml(u.name)}')">
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

      <!-- Pending Subscription Requests Platform-Wide Queue (Always Visible) -->
      <div class="card" style="margin-bottom:24px;border-left:4px solid var(--color-primary);background:var(--color-surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="card-title" style="margin-bottom:0;color:var(--color-primary);font-size:1.1rem;font-weight:800">
            <span class="icon">📋</span> Pending Subscription Requests (${pendingList.length})
          </div>
          <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Platform Tie-up Authority</span>
        </div>

        ${pendingList.length === 0 ? `
          <div style="text-align:center;padding:32px 16px;color:var(--color-text-muted)">
            <span style="font-size:2rem">✨</span>
            <div style="font-weight:700;margin-top:6px;color:var(--color-text)">No pending subscription requests right now.</div>
            <div style="font-size:0.85rem;margin-top:2px">When students request a Cash-on-Delivery plan, you can approve them here or in the Subscriptions tab.</div>
          </div>
        ` : `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>Sub ID</th><th>Student</th><th>Residence & Room</th><th>Vendor</th><th>Plan</th><th>Amount Due (COD)</th><th>Requested</th><th>Admin Decision</th></tr>
              </thead>
              <tbody>
                ${pendingList.map(s => `
                  <tr id="sub-req-row-${s.sub_id}">
                    <td style="font-size:0.78rem;font-family:monospace;color:var(--color-text-muted)"><code>${s.sub_id}</code></td>
                    <td><strong>${escapeHtml(s.customer_name)}</strong><br><small style="color:var(--color-text-muted)">📞 ${escapeHtml(s.customer_phone || '')}</small></td>
                    <td>${s.pg_or_flat_name ? `${escapeHtml(s.pg_or_flat_name)}, Rm ${escapeHtml(s.room_no || '—')}` : 'Campus'}</td>
                    <td><strong>${escapeHtml(s.vendor_name)}</strong></td>
                    <td><span class="badge badge-info">${escapeHtml(s.plan_name)}</span></td>
                    <td><strong style="color:var(--color-primary)">${formatINR(s.amount_due)}</strong></td>
                    <td style="font-size:0.8rem;color:var(--color-text-muted)">${formatDate(s.start_date || s.created_at)}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" style="background:var(--color-success);border-color:var(--color-success);padding:4px 12px;font-size:0.78rem;font-weight:700"
                          onclick="handleAdminApproveSub('${s.sub_id}', '${escapeHtml(s.customer_name)}')">
                          ✓ Approve
                        </button>
                        <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:4px 8px;font-size:0.78rem"
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

      <!-- Vendor Performance Table -->
      <div class="card" style="margin-bottom:24px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
          <span class="icon">🏪</span> Vendor Performance Overview
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Vendor</th><th>Location</th><th>Rating</th><th>Active Subscribers</th><th>Today's Deliveries</th><th>Pending Complaints</th></tr>
            </thead>
            <tbody>
              ${vendor_performance.map(v => `
                <tr>
                  <td><strong>${escapeHtml(v.name)}</strong></td>
                  <td>${escapeHtml(v.locality)}</td>
                  <td>${v.overall_rating ? '⭐ ' + v.overall_rating.toFixed(1) : '—'}</td>
                  <td><strong>${v.active_subscribers}</strong></td>
                  <td>${v.today_deliveries}</td>
                  <td>
                    <span class="${v.pending_complaints > 0 ? 'badge badge-pending' : 'badge badge-success'}" style="font-weight:700">
                      ${v.pending_complaints} pending
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Complaint Overview -->
      <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
          <span class="icon">📢</span> Recent Platform Complaints
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Complaint ID</th><th>Student</th><th>Vendor</th><th>Issue</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${complaint_overview.map(c => `
                <tr>
                  <td class="complaint-id" style="font-family:monospace;font-size:0.8rem"><code>${c.complaint_id}</code></td>
                  <td><strong>${escapeHtml(c.customer_name)}</strong></td>
                  <td>${escapeHtml(c.vendor_name)}</td>
                  <td><span class="badge badge-info">${escapeHtml(c.issue_type)}</span></td>
                  <td style="font-size:0.82rem;color:var(--color-text-muted)">${formatDate(c.created_at)}</td>
                  <td><span class="badge badge-${c.status}" style="font-weight:700">${c.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load admin dashboard: ' + err.message);
  }
}

async function handleApproveUser(userId, userName) {
  try {
    await approveUser(userId);
    showToast('Registration Approved', `${userName} has been verified and granted access!`, 'success');
    renderAdminDashboard();
  } catch (err) {
    showToast('Approval Error', err.message, 'error');
  }
}

async function handleRejectPendingUser(userId, userName) {
  if (!confirm(`Are you sure you want to reject and remove registration for ${userName}?`)) return;
  try {
    await deleteUser(userId);
    showToast('Registration Rejected', `${userName}'s registration was declined.`, 'info');
    renderAdminDashboard();
  } catch (err) {
    showToast('Rejection Error', err.message, 'error');
  }
}

async function handleAdminApproveSub(subId, studentName) {
  try {
    const res = await apiFetch(`/admin/subscription/${subId}/approve`, { method: 'PATCH' });
    showToast('Subscription Approved', `Subscription for ${studentName} approved by Admin!`, 'success');
    renderAdminDashboard();
  } catch (err) {
    showToast('Approval Error', err.message, 'error');
  }
}

async function handleAdminRejectSub(subId, studentName) {
  if (!confirm(`Reject subscription request for ${studentName}?`)) return;
  try {
    const res = await apiFetch(`/admin/subscription/${subId}/reject`, { method: 'PATCH' });
    showToast('Subscription Rejected', `Subscription for ${studentName} rejected.`, 'info');
    renderAdminDashboard();
  } catch (err) {
    showToast('Rejection Error', err.message, 'error');
  }
}

