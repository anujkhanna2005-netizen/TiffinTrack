// ============================================================
// TiffinTrack - Vendor Deliveries Page (Direct Vendor Fulfillment)
// public/js/pages/vendorDeliveries.js
// ============================================================

async function renderVendorDeliveries() {
  showLoading();
  try {
    const [vendorData, deliveries] = await Promise.all([
      getVendorData().catch(() => null),
      getDeliveries('vendor')
    ]);

    const vendorName = vendorData && vendorData.vendor ? vendorData.vendor.name : 'Kitchen';
    const totalCount = deliveries.length;
    const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;
    const dispatchedCount = deliveries.filter(d => d.status === 'dispatched' || d.status === 'out_for_delivery').length;
    const preparedCount = deliveries.filter(d => d.status === 'prepared' || d.status === 'pending').length;

    showContent(`
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <h1>📦 Meal Delivery & Dispatch Center</h1>
          <p>${escapeHtml(vendorName)} — Manage student dispatch and delivery status directly</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="renderVendorDeliveries()">↺ Refresh</button>
      </div>

      <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Total Today</div>
          <div class="stat-value">${totalCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Kitchen Prepared</div>
          <div class="stat-value" style="color:var(--color-warning)">${preparedCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Dispatched</div>
          <div class="stat-value" style="color:var(--color-info)">${dispatchedCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Delivered</div>
          <div class="stat-value" style="color:var(--color-success)">${deliveredCount}</div>
        </div>
      </div>

      <div id="vdel-alert"></div>

      <div class="card">
        <div class="card-title"><span class="icon">🍱</span> Active Student Deliveries</div>
        
        ${deliveries.length === 0 ? `
          <div class="empty-state" style="padding:30px">
            <div class="empty-icon">📭</div>
            <h3>No Scheduled Deliveries</h3>
            <p>No student deliveries scheduled for today yet.</p>
          </div>
        ` : `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Delivery ID</th>
                  <th>Student Name</th>
                  <th>Room / Residence</th>
                  <th>Meal Add-ons & Cooking Notes</th>
                  <th>Meal Slot</th>
                  <th>Current Status</th>
                  <th style="text-align:right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody>
                ${deliveries.map(d => {
                  let addonBadge = '';
                  if (d.bread_preference === 'extra_roti') {
                    addonBadge += '<span class="badge" style="background:#fff3e0;color:#e65100;font-weight:700;margin-right:4px">🍞 +1 Extra Roti</span>';
                  } else if (d.bread_preference === 'rice_only') {
                    addonBadge += '<span class="badge" style="background:#e8f5e9;color:#2e7d32;margin-right:4px">🍚 Rice Only</span>';
                  } else {
                    addonBadge += '<span class="badge" style="background:var(--color-surface-hover);color:var(--color-text-muted);margin-right:4px">🍞 Std Roti</span>';
                  }

                  if (d.spice_level === 'high') {
                    addonBadge += '<span class="badge" style="background:#ffebee;color:#c62828;font-weight:600">🌶️ High Spice</span>';
                  } else if (d.spice_level === 'low') {
                    addonBadge += '<span class="badge" style="background:#e0f2f1;color:#00695c">🌶️ Mild</span>';
                  } else if (d.spice_level === 'jain') {
                    addonBadge += '<span class="badge" style="background:#f3e5f5;color:#6a1b9a">🌱 Jain</span>';
                  }

                  if (d.special_instructions) {
                    addonBadge += `<div style="font-size:0.75rem;color:var(--color-text);margin-top:4px;background:#faf7f3;padding:2px 6px;border-radius:4px;border-left:2px solid var(--color-primary)">📝 "${escapeHtml(d.special_instructions)}"</div>`;
                  }

                  return `
                  <tr id="row-vdel-${escapeHtml(d.delivery_id)}">
                    <td style="font-size:0.8rem;color:var(--color-text-muted)"><code>${escapeHtml(d.delivery_id)}</code></td>
                    <td>
                      <strong>${escapeHtml(d.customer_name || (d.customer ? d.customer.name : 'Student'))}</strong>
                      <div style="font-size:0.75rem;color:var(--color-text-muted)">${escapeHtml(d.customer_phone || '')}</div>
                    </td>
                    <td>
                      <div>${escapeHtml(d.customer_address || (d.customer ? `${d.customer.residence}, Rm ${d.customer.room}` : 'Campus'))}</div>
                      <div style="font-size:0.75rem;color:var(--color-text-muted)">${escapeHtml(d.customer_locality || 'Campus Area')}</div>
                    </td>
                    <td>${addonBadge}</td>
                    <td><span class="badge badge-pill">${escapeHtml(d.meal_type || 'Lunch')}</span></td>
                    <td id="badge-vdel-${escapeHtml(d.delivery_id)}">${deliveryStatusBadge(d.status)}</td>
                    <td style="text-align:right">
                      <div id="action-vdel-${escapeHtml(d.delivery_id)}" style="display:inline-flex;gap:6px">
                        ${d.status === 'prepared' || d.status === 'pending' ? `
                          <button class="btn btn-sm btn-primary" style="font-size:0.78rem;padding:4px 8px" onclick="handleVendorUpdateStatus('${escapeHtml(d.delivery_id)}', 'dispatched')">
                            🛵 Dispatch
                          </button>
                        ` : (d.status === 'dispatched' || d.status === 'out_for_delivery') ? `
                          <button class="btn btn-sm btn-secondary" style="font-size:0.78rem;padding:4px 8px;background:var(--color-success);color:#fff;border:none" onclick="handleVendorUpdateStatus('${escapeHtml(d.delivery_id)}', 'delivered')">
                            ✅ Mark Delivered
                          </button>
                        ` : `
                          <span style="color:var(--color-success);font-weight:600;font-size:0.8rem">✓ Completed</span>
                        `}
                      </div>
                    </td>
                  </tr>
                `;}).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `);
  } catch (err) {
    showError('Failed to load vendor deliveries: ' + err.message);
  }
}

async function handleVendorUpdateStatus(deliveryId, newStatus) {
  const actionDiv = document.getElementById('action-vdel-' + deliveryId);
  const badgeDiv = document.getElementById('badge-vdel-' + deliveryId);

  if (actionDiv) {
    actionDiv.innerHTML = '<span style="font-size:0.75rem;color:var(--color-text-muted)">Updating...</span>';
  }

  try {
    await updateDeliveryStatus(deliveryId, newStatus);
    showToast('Delivery Updated', `Status changed to ${newStatus.toUpperCase()}`, 'success');
    if (badgeDiv) badgeDiv.innerHTML = deliveryStatusBadge(newStatus);

    if (actionDiv) {
      if (newStatus === 'dispatched') {
        actionDiv.innerHTML = `
          <button class="btn btn-sm btn-secondary" style="font-size:0.78rem;padding:4px 8px;background:var(--color-success);color:#fff;border:none" onclick="handleVendorUpdateStatus('${deliveryId}', 'delivered')">
            ✅ Mark Delivered
          </button>
        `;
      } else if (newStatus === 'delivered') {
        actionDiv.innerHTML = '<span style="color:var(--color-success);font-weight:600;font-size:0.8rem">✓ Completed</span>';
      }
    }
  } catch (err) {
    showToast('Error', err.message, 'error');
    renderVendorDeliveries();
  }
}
