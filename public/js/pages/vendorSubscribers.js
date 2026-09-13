// ============================================================
// TiffinTrack - Vendor Subscribers Page
// public/js/pages/vendorSubscribers.js
// ============================================================

async function renderVendorSubscribers() {
  showLoading();
  try {
    const data = await getVendorData();
    const { subscribers, stats } = data;

    showContent(`
      <div class="page-header">
        <h1>👥 Subscribers</h1>
        <p>Active students subscribed to Annapurna Tiffin Services</p>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Active Subscribers</div>
          <div class="stat-value">${stats.active_subscribers}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Today's Meals</div>
          <div class="stat-value">${stats.today_deliveries}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Monthly Revenue</div>
          <div class="stat-value" style="font-size:1.1rem;margin-top:6px">
            Est. ${formatINR(subscribers.reduce((acc, s) => acc + (s.plan ? s.plan.price : 0), 0))}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span class="icon">👥</span> Active Subscriber List</div>
        ${subscribers.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Residence</th>
                  <th>Room</th>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${subscribers.map(s => `
                  <tr>
                    <td><strong>${s.customer ? s.customer.name : '—'}</strong></td>
                    <td>${s.customer ? s.customer.residence : '—'}</td>
                    <td>${s.customer ? s.customer.room : '—'}</td>
                    <td>${s.plan ? s.plan.name : '—'}</td>
                    <td>${s.plan ? formatINR(s.plan.price) : '—'}</td>
                    <td>${formatDate(s.start_date)}</td>
                    <td>${formatDate(s.end_date)}</td>
                    <td><span class="badge badge-${s.status}">${s.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<div class="empty-state"><div class="empty-icon">👥</div><p>No active subscribers.</p></div>`}
      </div>
    `);
  } catch (err) {
    showError('Failed to load subscribers: ' + err.message);
  }
}
