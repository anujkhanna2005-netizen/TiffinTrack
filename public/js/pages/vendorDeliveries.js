// ============================================================
// TiffinTrack - Vendor Deliveries Page
// public/js/pages/vendorDeliveries.js
// ============================================================

async function renderVendorDeliveries() {
  showLoading();
  try {
    const deliveries = await getDeliveries('vendor');

    showContent(`
      <div class="page-header">
        <h1>🛵 Deliveries</h1>
        <p>Today's delivery status for Annapurna Tiffin Services</p>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Total Today</div>
          <div class="stat-value">${deliveries.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Delivered</div>
          <div class="stat-value" style="color:var(--color-success)">${deliveries.filter(d=>d.status==='delivered').length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Out for Delivery</div>
          <div class="stat-value" style="color:var(--color-info)">${deliveries.filter(d=>d.status==='out_for_delivery').length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending</div>
          <div class="stat-value" style="color:var(--color-warning)">${deliveries.filter(d=>d.status==='pending').length}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span class="icon">🛵</span> Today's Deliveries</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Delivery ID</th><th>Student</th><th>Room</th><th>Residence</th><th>Meal</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${deliveries.map(d => `
                <tr>
                  <td style="font-size:0.82rem;color:var(--color-text-muted)">${d.delivery_id}</td>
                  <td><strong>${d.customer ? d.customer.name : '—'}</strong></td>
                  <td>${d.customer ? d.customer.room : '—'}</td>
                  <td>${d.customer ? d.customer.residence : '—'}</td>
                  <td>${d.meal_type}</td>
                  <td>${deliveryStatusBadge(d.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load deliveries: ' + err.message);
  }
}
