// ============================================================
// TiffinTrack - Admin Ratings Page
// public/js/pages/adminRatings.js
// ============================================================

async function renderAdminRatings() {
  showLoading();
  try {
    const data = await getAdminData();
    const vendors = data.vendor_performance;

    showContent(`
      <div class="page-header">
        <h1>⭐ Ratings Overview</h1>
        <p>Platform-wide rating analysis</p>
      </div>

      <div class="stat-card" style="margin-bottom:20px;display:inline-block;min-width:200px">
        <div class="stat-label">Platform Average Rating</div>
        <div class="stat-value">${data.stats.platform_avg_rating ? data.stats.platform_avg_rating.toFixed(1) : '—'}</div>
        <div class="stat-sub">Across all vendors</div>
      </div>

      <div class="card">
        <div class="card-title"><span class="icon">⭐</span> Vendor Ratings Comparison</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Vendor</th><th>Location</th><th>Avg Rating</th><th>Active Students</th><th>Rank</th></tr>
            </thead>
            <tbody>
              ${[...vendors].sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0)).map((v, i) => `
                <tr>
                  <td><strong>${v.name}</strong></td>
                  <td>${v.locality}</td>
                  <td>${v.overall_rating ? renderStars(v.overall_rating) : '<span style="color:var(--color-text-muted)">No ratings</span>'}</td>
                  <td>${v.active_subscribers}</td>
                  <td>${i === 0 ? '🥇 #1' : i === 1 ? '🥈 #2' : i === 2 ? '🥉 #3' : '#' + (i+1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load ratings: ' + err.message);
  }
}
