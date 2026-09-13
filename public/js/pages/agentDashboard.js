// ============================================================
// TiffinTrack - Delivery Agent Dashboard
// public/js/pages/agentDashboard.js
// ============================================================

async function renderAgentDashboard() {
  showLoading();
  try {
    const deliveries = await getDeliveries('agent');

    const pending    = deliveries.filter(d => d.status === 'pending').length;
    const onRoute    = deliveries.filter(d => d.status === 'out_for_delivery').length;
    const delivered  = deliveries.filter(d => d.status === 'delivered').length;

    showContent(`
      <div class="page-header">
        <h1>🛵 Agent Dashboard</h1>
        <p>Welcome, Amit Kumar &nbsp;|&nbsp; Zone: Koramangala / HSR Layout</p>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Today's Total</div>
          <div class="stat-value">${deliveries.length}</div>
          <div class="stat-sub">Assigned deliveries</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Delivered</div>
          <div class="stat-value" style="color:var(--color-success)">${delivered}</div>
          <div class="stat-sub">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Out for Delivery</div>
          <div class="stat-value" style="color:var(--color-info)">${onRoute}</div>
          <div class="stat-sub">In transit</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending</div>
          <div class="stat-value" style="color:var(--color-warning)">${pending}</div>
          <div class="stat-sub">To be picked up</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span class="icon">🛵</span> Today's Deliveries</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Student</th><th>Room</th><th>Vendor</th><th>Meal</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody id="delivery-table">
              ${deliveries.map(d => renderDeliveryRow(d)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:20px">
        <div class="card-title"><span class="icon">ℹ️</span> Agent Info</div>
        <div style="font-size:0.875rem;color:var(--color-text-muted);display:flex;gap:24px;flex-wrap:wrap">
          <div>👤 Amit Kumar &nbsp;(A001)</div>
          <div>📍 Zone: Koramangala / HSR Layout</div>
          <div>📞 9700001001</div>
        </div>
      </div>
    `);
  } catch (err) {
    showError('Failed to load agent dashboard: ' + err.message);
  }
}

function renderDeliveryRow(d) {
  const canUpdate = d.status !== 'delivered';
  const nextStatus = d.status === 'pending' ? 'out_for_delivery' : 'delivered';
  const actionLabel = d.status === 'pending' ? 'Mark Out for Delivery' : 'Mark Delivered';

  return `
    <tr id="delivery-row-${d.delivery_id}">
      <td><strong>${d.customer ? d.customer.name : '—'}</strong></td>
      <td>${d.customer ? d.customer.room : '—'}</td>
      <td>${d.vendor ? d.vendor.name : '—'}</td>
      <td>${d.meal_type}</td>
      <td id="status-${d.delivery_id}">${deliveryStatusBadge(d.status)}</td>
      <td>
        ${canUpdate ? `
          <button class="btn btn-primary btn-sm" onclick="handleUpdateDelivery('${d.delivery_id}', '${nextStatus}')" id="btn-delivery-${d.delivery_id}">
            ${actionLabel}
          </button>
        ` : '<span style="color:var(--color-success);font-size:0.82rem">✅ Done</span>'}
      </td>
    </tr>
  `;
}

async function handleUpdateDelivery(deliveryId, newStatus) {
  const btn = document.getElementById('btn-delivery-' + deliveryId);
  if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

  try {
    await updateDeliveryStatus(deliveryId, newStatus);

    // Update the status cell in-place (no full page reload)
    const statusCell = document.getElementById('status-' + deliveryId);
    if (statusCell) statusCell.innerHTML = deliveryStatusBadge(newStatus);

    if (newStatus === 'out_for_delivery') {
      // Update button to "Mark Delivered"
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Mark Delivered';
        btn.onclick = () => handleUpdateDelivery(deliveryId, 'delivered');
      }
    } else if (newStatus === 'delivered') {
      if (btn) {
        btn.outerHTML = '<span style="color:var(--color-success);font-size:0.82rem">✅ Done</span>';
      }
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    if (btn) { btn.disabled = false; }
  }
}
