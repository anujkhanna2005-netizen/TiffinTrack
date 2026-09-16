// ============================================================
// TiffinTrack - Admin Dashboard
// public/js/pages/adminDashboard.js
// ============================================================

async function renderAdminDashboard() {
  showLoading();
  try {
    const data = await getAdminData();
    const { stats, vendor_performance, customer_activity, complaint_overview } = data;

    showContent(`
      <div class="page-header">
        <h1>🔧 Admin Dashboard</h1>
        <p>TiffinTrack Administrator — Platform Overview</p>
      </div>

      <!-- Platform Stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">${stats.total_students}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Vendors</div>
          <div class="stat-value">${stats.total_vendors}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Subscriptions</div>
          <div class="stat-value">${stats.active_subscriptions}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Today's Deliveries</div>
          <div class="stat-value">${stats.today_deliveries}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Complaints</div>
          <div class="stat-value" style="color:${stats.pending_complaints > 0 ? 'var(--color-danger)' : 'var(--color-success)'}">
            ${stats.pending_complaints}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Approvals</div>
          <div class="stat-value" style="color:${stats.pending_approvals > 0 ? '#ea580c' : 'var(--color-text)'}">
            ${stats.pending_approvals || 0}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Platform Avg Rating</div>
          <div class="stat-value">${stats.platform_avg_rating ? stats.platform_avg_rating.toFixed(1) : '—'}</div>
        </div>
      </div>

      <!-- Pending Verification & Approval Queue -->
      ${data.pending_approvals && data.pending_approvals.length > 0 ? `
        <div class="card" style="margin-bottom:20px;border-left:4px solid #ea580c;background:#fffaf0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <div class="card-title" style="margin-bottom:0;color:#9a3412">
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
                    <td><span class="badge badge-pending">${u.role.toUpperCase()}</span></td>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.email}</td>
                    <td>${u.phone}</td>
                    <td>${u.locality}</td>
                    <td style="font-size:0.8rem;color:var(--color-text-muted)">${formatDate(u.created_at)}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" style="background:var(--color-success);border-color:var(--color-success);padding:4px 10px;font-size:0.8rem"
                          onclick="handleApproveUser('${u.user_id}', '${u.name}')">
                          ✓ Approve Access
                        </button>
                        <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);padding:4px 8px;font-size:0.8rem"
                          onclick="handleRejectPendingUser('${u.user_id}', '${u.name}')">
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

      <!-- Pending Subscription Requests Platform-Wide Queue -->
      ${data.pending_subscriptions && data.pending_subscriptions.length > 0 ? `
        <div class="card" style="margin-bottom:20px;border-left:4px solid var(--color-primary);background:#f0fdf4">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <div class="card-title" style="margin-bottom:0;color:#166534">
              <span class="icon">📋</span> Platform-Wide Subscription Requests (${data.pending_subscriptions.length})
            </div>
            <span class="badge" style="background:#bbf7d0;color:#166534;font-weight:700">Admin Tie-up Authority</span>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>Sub ID</th><th>Student</th><th>Residence & Room</th><th>Vendor</th><th>Plan</th><th>Amount Due (COD)</th><th>Requested</th><th>Admin Decision</th></tr>
              </thead>
              <tbody>
                ${data.pending_subscriptions.map(s => `
                  <tr id="sub-req-row-${s.sub_id}">
                    <td style="font-size:0.78rem;color:var(--color-text-muted)"><code>${s.sub_id}</code></td>
                    <td><strong>${s.customer_name}</strong><br><small style="color:var(--color-text-muted)">${s.customer_phone || ''}</small></td>
                    <td>${s.pg_or_flat_name ? `${s.pg_or_flat_name}, Rm ${s.room_no || '—'}` : 'Campus'}</td>
                    <td><strong>${s.vendor_name}</strong></td>
                    <td><span class="badge badge-info">${s.plan_name}</span></td>
                    <td><strong>${formatINR(s.amount_due)}</strong></td>
                    <td style="font-size:0.8rem;color:var(--color-text-muted)">${formatDate(s.start_date || s.created_at)}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" style="background:var(--color-success);border-color:var(--color-success);padding:4px 10px;font-size:0.78rem"
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
        </div>
      ` : ''}

      <!-- Vendor Performance Table -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-title"><span class="icon">🏪</span> Vendor Performance</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Vendor</th><th>Location</th><th>Rating</th><th>Active Subscribers</th><th>Today's Deliveries</th><th>Pending Complaints</th></tr>
            </thead>
            <tbody>
              ${vendor_performance.map(v => `
                <tr>
                  <td><strong>${v.name}</strong></td>
                  <td>${v.locality}</td>
                  <td>${v.overall_rating ? '⭐ ' + v.overall_rating.toFixed(1) : '—'}</td>
                  <td>${v.active_subscribers}</td>
                  <td>${v.today_deliveries}</td>
                  <td>
                    <span class="${v.pending_complaints > 0 ? 'badge badge-pending' : 'badge badge-success'}">
                      ${v.pending_complaints}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Complaint Overview -->
      <div class="card">
        <div class="card-title"><span class="icon">📢</span> Complaint Overview</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Complaint ID</th><th>Student</th><th>Vendor</th><th>Issue</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${complaint_overview.map(c => `
                <tr>
                  <td class="complaint-id">${c.complaint_id}</td>
                  <td>${c.customer_name}</td>
                  <td>${c.vendor_name}</td>
                  <td>${c.issue_type}</td>
                  <td>${formatDate(c.created_at)}</td>
                  <td><span class="badge badge-${c.status}">${c.status}</span></td>
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

