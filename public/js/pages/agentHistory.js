// ============================================================
// TiffinTrack - Agent Delivery History Page
// public/js/pages/agentHistory.js
// ============================================================

async function renderAgentHistory() {
  showLoading();
  try {
    const deliveries = await getDeliveries('agent');

    // In Preview V1, history shows all deliveries (same as today in mock)
    const delivered = deliveries.filter(d => d.status === 'delivered');

    showContent(`
      <div class="page-header">
        <h1>📜 Delivery History</h1>
        <p>Amit Kumar — all completed deliveries</p>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Total Assigned</div>
          <div class="stat-value">${deliveries.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Completed</div>
          <div class="stat-value" style="color:var(--color-success)">${delivered.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Completion Rate</div>
          <div class="stat-value">${deliveries.length > 0 ? Math.round((delivered.length / deliveries.length) * 100) : 0}%</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span class="icon">📜</span> Completed Deliveries</div>
        ${delivered.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Delivery ID</th><th>Student</th><th>Vendor</th><th>Meal</th><th>Status</th></tr></thead>
              <tbody>
                ${delivered.map(d => `
                  <tr>
                    <td style="font-size:0.82rem;color:var(--color-text-muted)">${d.delivery_id}</td>
                    <td><strong>${d.customer ? d.customer.name : '—'}</strong> (Rm ${d.customer ? d.customer.room : '—'})</td>
                    <td>${d.vendor ? d.vendor.name : '—'}</td>
                    <td>${d.meal_type}</td>
                    <td>${deliveryStatusBadge(d.status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">📜</div>
            <h3>No completed deliveries yet</h3>
            <p>Mark deliveries as delivered on the Today's Deliveries page.</p>
          </div>
        `}
      </div>
    `);
  } catch (err) {
    showError('Failed to load history: ' + err.message);
  }
}
