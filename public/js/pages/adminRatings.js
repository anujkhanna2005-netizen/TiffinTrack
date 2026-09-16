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
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Platform Command Center</span>
            <span style="font-size:0.8rem;color:var(--color-text-muted)">• Quality Benchmarks</span>
          </div>
          <h1 style="font-size:1.6rem;font-weight:800;color:var(--color-text);margin:0">⭐ Platform Ratings & Leaderboard</h1>
          <p style="color:var(--color-text-muted);margin-top:4px;font-size:0.88rem">Platform-wide rating analysis and quality performance ranking across kitchens</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="renderAdminRatings()" style="display:flex;align-items:center;gap:6px">
          ↺ Refresh Rankings
        </button>
      </div>

      <div class="stat-card" style="margin-bottom:24px;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);max-width:300px">
        <div class="stat-label" style="font-weight:600;font-size:0.82rem">Platform Average Rating</div>
        <div class="stat-value" style="font-size:2.4rem;font-weight:900;color:var(--color-primary);margin-top:4px">
          ⭐ ${data.stats.platform_avg_rating ? data.stats.platform_avg_rating.toFixed(1) : (data.stats.avg_rating ? data.stats.avg_rating.toFixed(1) : '—')}
        </div>
        <div class="stat-sub" style="font-size:0.8rem;color:var(--color-text-muted);margin-top:4px">Across all verified dining reviews</div>
      </div>

      <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
          <span class="icon">⭐</span> Vendor Ratings Performance Leaderboard
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Rank</th><th>Vendor Name</th><th>Campus Locality</th><th>Average Score</th><th>Active Diners</th></tr>
            </thead>
            <tbody>
              ${[...vendors].sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0)).map((v, i) => `
                <tr>
                  <td><span class="badge ${i === 0 ? 'badge-success' : 'badge-pill'}" style="font-weight:700">${i === 0 ? '🥇 #1 Top' : i === 1 ? '🥈 #2' : i === 2 ? '🥉 #3' : '#' + (i+1)}</span></td>
                  <td><strong>${escapeHtml(v.name)}</strong></td>
                  <td>${escapeHtml(v.locality)}</td>
                  <td>${v.overall_rating ? `${renderStars(v.overall_rating)} <strong style="color:var(--color-text);margin-left:4px">(${v.overall_rating.toFixed(1)})</strong>` : '<span style="color:var(--color-text-muted)">No ratings</span>'}</td>
                  <td><strong>${v.active_subscribers}</strong></td>
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
