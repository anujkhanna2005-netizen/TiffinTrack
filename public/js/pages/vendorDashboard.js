// ============================================================
// TiffinTrack - Vendor Dashboard
// public/js/pages/vendorDashboard.js
// ============================================================

async function renderVendorDashboard() {
  showLoading();
  try {
    const data = await getVendorData();
    const { vendor, stats, rating_breakdown, recent_ratings, complaints, subscribers } = data;

    showContent(`
      <div class="page-header">
        <h1>🏪 Vendor Dashboard</h1>
        <p>${vendor.name} • ${vendor.locality}, ${vendor.city}</p>
      </div>

      <!-- Stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Active Subscribers</div>
          <div class="stat-value">${stats.active_subscribers}</div>
          <div class="stat-sub">Current active plans</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Today's Deliveries</div>
          <div class="stat-value">${stats.today_deliveries}</div>
          <div class="stat-sub">Scheduled for today</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average Rating</div>
          <div class="stat-value">${stats.overall_rating ? stats.overall_rating.toFixed(1) : '—'}</div>
          <div class="stat-sub">${stats.rating_count} review${stats.rating_count !== 1 ? 's' : ''}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Complaints</div>
          <div class="stat-value" style="color:${stats.pending_complaints > 0 ? 'var(--color-danger)' : 'var(--color-success)'}">
            ${stats.pending_complaints}
          </div>
          <div class="stat-sub">Needs attention</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Rating Breakdown -->
        ${rating_breakdown ? `
        <div class="card">
          <div class="card-title"><span class="icon">⭐</span> Rating Breakdown</div>
          <div class="rating-breakdown">
            ${[['Taste', rating_breakdown.taste], ['Hygiene', rating_breakdown.hygiene], ['Punctuality', rating_breakdown.punctuality], ['Value', rating_breakdown.value]].map(([label, val]) => `
              <div class="rating-bar-row">
                <div class="rating-bar-label">${label}</div>
                <div class="rating-bar-track"><div class="rating-bar-fill" style="width:${(val/5)*100}%"></div></div>
                <div class="rating-bar-score">${val}</div>
              </div>
            `).join('')}
          </div>
        </div>` : '<div class="card"><div class="empty-state"><div class="empty-icon">⭐</div><p>No ratings yet.</p></div></div>'}

        <!-- Recent Complaints -->
        <div class="card">
          <div class="card-title"><span class="icon">📢</span> Recent Complaints</div>
          ${complaints.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:8px">
              ${complaints.slice(0,4).map(c => `
                <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--color-border)">
                  <div>
                    <div style="font-size:0.82rem;font-weight:600">${c.issue_type}</div>
                    <div style="font-size:0.78rem;color:var(--color-text-muted)">${c.customer_name} • ${formatDate(c.created_at)}</div>
                  </div>
                  <span class="badge badge-${c.status}">${c.status}</span>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="navigateTo('vendorComplaints')">View All →</button>
          ` : '<div class="empty-state"><div class="empty-icon">✅</div><p>No complaints.</p></div>'}
        </div>

        <!-- Recent Ratings -->
        <div class="card full-width">
          <div class="card-title"><span class="icon">💬</span> Recent Student Reviews</div>
          ${recent_ratings.length > 0 ? `
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Student</th><th>Taste</th><th>Hygiene</th><th>Punctuality</th><th>Value</th><th>Review</th><th>Date</th></tr></thead>
                <tbody>
                  ${recent_ratings.map(r => `
                    <tr>
                      <td>${r.customer_name}</td>
                      <td>${r.taste_score}/5</td>
                      <td>${r.hygiene_score}/5</td>
                      <td>${r.punctuality_score}/5</td>
                      <td>${r.value_score}/5</td>
                      <td style="max-width:200px;font-size:0.82rem">${r.review || '—'}</td>
                      <td>${formatDate(r.created_at)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<div class="empty-state"><div class="empty-icon">⭐</div><p>No reviews yet.</p></div>'}
        </div>

        <!-- Subscribers -->
        <div class="card full-width">
          <div class="card-title"><span class="icon">👥</span> Active Subscribers (${subscribers.length})</div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Student</th><th>Residence</th><th>Room</th><th>Plan</th><th>Since</th><th>Status</th></tr></thead>
              <tbody>
                ${subscribers.map(s => `
                  <tr>
                    <td>${s.customer ? s.customer.name : '—'}</td>
                    <td>${s.customer ? s.customer.residence : '—'}</td>
                    <td>${s.customer ? s.customer.room : '—'}</td>
                    <td>${s.plan ? s.plan.name : '—'}</td>
                    <td>${formatDate(s.start_date)}</td>
                    <td><span class="badge badge-${s.status}">${s.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load vendor dashboard: ' + err.message);
  }
}
