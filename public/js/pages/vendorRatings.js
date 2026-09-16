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
      <div class="page-header" style="margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Quality Intelligence</span>
          <span style="font-size:0.8rem;color:var(--color-text-muted)">• Student Reviews</span>
        </div>
        <h1 style="font-size:1.6rem;font-weight:800;color:var(--color-text);margin:0">⭐ Ratings & Reviews</h1>
        <p style="color:var(--color-text-muted);margin-top:4px;font-size:0.88rem">${data.vendor ? escapeHtml(data.vendor.name) : 'Kitchen'} — Verified feedback & weighted scores</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 2fr;gap:24px;margin-bottom:24px">
        <!-- Summary -->
        <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);height:fit-content">
          <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:14px">
            <span class="icon">📊</span> Rating Summary
          </div>
          <div style="text-align:center;margin:16px 0;padding:16px;background:var(--color-surface-hover);border-radius:var(--radius)">
            <div style="font-size:3.2rem;font-weight:900;color:var(--color-primary);line-height:1">${data.stats.overall_rating ? data.stats.overall_rating.toFixed(1) : '—'}</div>
            <div style="margin:8px 0 4px">${renderStars(data.stats.overall_rating)}</div>
            <div style="color:var(--color-text-muted);font-size:0.85rem;font-weight:600">${data.stats.rating_count} verified reviews</div>
          </div>
          ${rb ? `
          <div class="rating-breakdown" style="margin-top:16px;display:flex;flex-direction:column;gap:10px">
            ${[['Taste (35%)', rb.taste], ['Hygiene (25%)', rb.hygiene], ['Punctuality (25%)', rb.punctuality], ['Value (15%)', rb.value]].map(([label, val]) => `
              <div class="rating-bar-row">
                <div class="rating-bar-label" style="font-size:0.82rem;font-weight:600">${label}</div>
                <div class="rating-bar-track" style="height:8px;border-radius:9999px"><div class="rating-bar-fill" style="width:${(val/5)*100}%;border-radius:9999px;background:var(--color-primary)"></div></div>
                <div class="rating-bar-score" style="font-size:0.85rem;font-weight:700">${val}</div>
              </div>
            `).join('')}
          </div>` : ''}
        </div>

        <!-- Reviews List -->
        <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
          <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
            <span class="icon">💬</span> Student Testimonials (${allRatings.length})
          </div>
          ${allRatings.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:14px;max-height:480px;overflow-y:auto;padding-right:4px">
              ${allRatings.map(r => {
                const overall = (0.35*r.taste_score + 0.25*r.hygiene_score + 0.25*r.punctuality_score + 0.15*r.value_score).toFixed(1);
                return `
                  <div style="border:1px solid var(--color-border);border-radius:var(--radius);padding:14px;background:var(--color-surface);box-shadow:var(--shadow-sm)">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <span style="font-weight:700;font-size:0.95rem;color:var(--color-text)">${escapeHtml(r.customer_name)}</span>
                      <span style="font-size:0.78rem;color:var(--color-text-muted)">${formatDate(r.created_at)}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin:8px 0;flex-wrap:wrap;font-size:0.78rem">
                      <span class="badge" style="background:#e8f5e9;color:#2e7d32">Taste: ${r.taste_score}</span>
                      <span class="badge" style="background:#e0f2f1;color:#00695c">Hygiene: ${r.hygiene_score}</span>
                      <span class="badge" style="background:#fff3e0;color:#e65100">Punctuality: ${r.punctuality_score}</span>
                      <span class="badge" style="background:#f3e5f5;color:#6a1b9a">Value: ${r.value_score}</span>
                      <span class="badge badge-success" style="font-weight:700">★ ${overall}</span>
                    </div>
                    ${r.review ? `<p style="font-size:0.88rem;color:var(--color-text-muted);margin:6px 0 0;line-height:1.5;background:var(--color-surface-hover);padding:8px 12px;border-radius:6px;font-style:italic">"${escapeHtml(r.review)}"</p>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<div class="empty-state" style="padding:48px"><div class="empty-icon" style="font-size:2.5rem">⭐</div><p style="color:var(--color-text-muted)">No reviews submitted yet.</p></div>'}
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load ratings: ' + err.message);
  }
}
