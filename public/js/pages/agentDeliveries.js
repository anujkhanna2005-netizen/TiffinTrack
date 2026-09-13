// ============================================================
// TiffinTrack - Agent Today's Deliveries Page
// public/js/pages/agentDeliveries.js
// ============================================================

async function renderAgentDeliveries() {
  showLoading();
  try {
    const deliveries = await getDeliveries('agent');

    showContent(`
      <div class="page-header">
        <h1>📦 Today's Deliveries</h1>
        <p>All deliveries assigned to Amit Kumar — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px">
        ${deliveries.map(d => `
          <div class="card" id="delivery-card-${d.delivery_id}" style="border-left: 4px solid ${d.status === 'delivered' ? 'var(--color-success)' : d.status === 'out_for_delivery' ? 'var(--color-info)' : 'var(--color-warning)'}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
              <div>
                <div style="font-weight:700;font-size:1rem">${d.customer ? d.customer.name : '—'}</div>
                <div style="color:var(--color-text-muted);font-size:0.875rem">
                  📍 ${d.customer ? d.customer.residence : '—'}, Room ${d.customer ? d.customer.room : '—'}
                </div>
                <div style="color:var(--color-text-muted);font-size:0.82rem;margin-top:4px">
                  🏪 ${d.vendor ? d.vendor.name : '—'} &nbsp;|&nbsp; 🍽️ ${d.meal_type}
                </div>
              </div>
              <div style="text-align:right">
                <div id="status-adel-${d.delivery_id}">${deliveryStatusBadge(d.status)}</div>
                <div style="margin-top:8px">
                  ${d.status !== 'delivered' ? `
                    <button class="btn btn-primary btn-sm" onclick="handleAgentDeliveryUpdate('${d.delivery_id}', '${d.status === 'pending' ? 'out_for_delivery' : 'delivered'}')" id="btn-adel-${d.delivery_id}">
                      ${d.status === 'pending' ? '🛵 Start Delivery' : '✅ Mark Delivered'}
                    </button>
                  ` : '<span style="color:var(--color-success);font-weight:600;font-size:0.85rem">✅ Delivered</span>'}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
        ${deliveries.length === 0 ? `<div class="empty-state"><div class="empty-icon">📦</div><h3>No deliveries today</h3></div>` : ''}
      </div>
    `);
  } catch (err) {
    showError('Failed to load deliveries: ' + err.message);
  }
}

async function handleAgentDeliveryUpdate(deliveryId, newStatus) {
  const btn = document.getElementById('btn-adel-' + deliveryId);
  if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

  try {
    await updateDeliveryStatus(deliveryId, newStatus);

    const statusDiv = document.getElementById('status-adel-' + deliveryId);
    if (statusDiv) statusDiv.innerHTML = deliveryStatusBadge(newStatus);

    const card = document.getElementById('delivery-card-' + deliveryId);
    if (card) {
      card.style.borderLeftColor = newStatus === 'delivered' ? 'var(--color-success)' : 'var(--color-info)';
    }

    if (newStatus === 'out_for_delivery') {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '✅ Mark Delivered';
        btn.onclick = () => handleAgentDeliveryUpdate(deliveryId, 'delivered');
      }
    } else if (newStatus === 'delivered') {
      if (btn) {
        btn.outerHTML = '<span style="color:var(--color-success);font-weight:600;font-size:0.85rem">✅ Delivered</span>';
      }
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    if (btn) btn.disabled = false;
  }
}
