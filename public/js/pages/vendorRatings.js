// ============================================================
// TiffinTrack - Vendor Ratings Page
// public/js/pages/vendorRatings.js
// ============================================================

async function renderVendorRatings() {
  showLoading();
  try {
    const [data, allRatings] = await Promise.all([
      getVendorData(),
      getVendorRatings()
    ]);

    const rb = data.rating_breakdown;

    showContent(`
      <div class="page-header">
        <h1>⭐ Ratings & Reviews</h1>
        <p>Annapurna Tiffin Services — student feedback</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 2fr;gap:20px;margin-bottom:20px">
        <!-- Summary -->
        <div class="card">
          <div class="card-title"><span class="icon">📊</span> Rating Summary</div>
          <div style="text-align:center;margin:12px 0">
            <div style="font-size:3rem;font-weight:700;color:var(--color-primary)">${data.stats.overall_rating ? data.stats.overall_rating.toFixed(1) : '—'}</div>
            <div>${renderStars(data.stats.overall_rating)}</div>
            <div style="color:var(--color-text-muted);font-size:0.82rem">${data.stats.rating_count} reviews</div>
          </div>
          ${rb ? `
          <div class="rating-breakdown" style="margin-top:12px">
            ${[['Taste', rb.taste], ['Hygiene', rb.hygiene], ['Punctuality', rb.punctuality], ['Value', rb.value]].map(([label, val]) => `
              <div class="rating-bar-row">
                <div class="rating-bar-label">${label}</div>
                <div class="rating-bar-track"><div class="rating-bar-fill" style="width:${(val/5)*100}%"></div></div>
                <div class="rating-bar-score">${val}</div>
              </div>
            `).join('')}
          </div>` : ''}
        </div>

        <!-- Distribution -->
        <div class="card">
          <div class="card-title"><span class="icon">💬</span> All Reviews (${allRatings.length})</div>
          ${allRatings.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:12px;max-height:400px;overflow-y:auto">
              ${allRatings.map(r => {
                const overall = (0.35*r.taste_score + 0.25*r.hygiene_score + 0.25*r.punctuality_score + 0.15*r.value_score).toFixed(1);
                return `
                  <div style="border-bottom:1px solid var(--color-border);padding-bottom:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <span style="font-weight:600">${r.customer_name}</span>
                      <span style="font-size:0.78rem;color:var(--color-text-muted)">${formatDate(r.created_at)}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin:4px 0;flex-wrap:wrap;font-size:0.78rem;color:var(--color-text-muted)">
                      <span>Taste: ${r.taste_score}</span>
                      <span>Hygiene: ${r.hygiene_score}</span>
                      <span>Punct: ${r.punctuality_score}</span>
                      <span>Value: ${r.value_score}</span>
                      <span style="color:var(--color-primary);font-weight:600">Overall: ${overall}</span>
                    </div>
                    ${r.review ? `<p style="font-size:0.85rem;color:var(--color-text-muted)">"${r.review}"</p>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<div class="empty-state"><div class="empty-icon">⭐</div><p>No reviews yet.</p></div>'}
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load ratings: ' + err.message);
  }
}
