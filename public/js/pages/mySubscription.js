// ============================================================
// TiffinTrack - My Subscription Page
// public/js/pages/mySubscription.js
// ============================================================

async function renderMySubscription() {
  showLoading();
  try {
    const [subscription, customer] = await Promise.all([
      getSubscription(),
      getCustomer()
    ]);

    showContent(`
      <div class="page-header">
        <h1>📋 My Subscription</h1>
        <p>Manage your current meal plan subscription.</p>
      </div>

      ${subscription ? renderSubscriptionDetails(subscription, customer) : renderNoSub()}
    `);
  } catch (err) {
    showError('Failed to load subscription: ' + err.message);
  }
}

function renderSubscriptionDetails(sub, customer) {
  const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  return `
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
      <div>
        <div class="card subscription-card" style="margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h2 style="font-size:1.1rem;font-weight:700">${sub.plan.name}</h2>
            <span class="badge badge-active">Active</span>
          </div>

          <div class="sub-meta-grid" style="grid-template-columns:repeat(3,1fr)">
            <div class="sub-meta-item">
              <div class="label">Vendor</div>
              <div class="value">${sub.vendor.name}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Cuisine</div>
              <div class="value">${sub.vendor.cuisine}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Location</div>
              <div class="value">${sub.vendor.locality}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Monthly Price</div>
              <div class="value" style="color:var(--color-primary)">${formatINR(sub.plan.price)}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Start Date</div>
              <div class="value">${formatDate(sub.start_date)}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">End Date</div>
              <div class="value">${formatDate(sub.end_date)}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Days Left</div>
              <div class="value">${daysLeft > 0 ? daysLeft + ' days' : 'Expired'}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Auto Renew</div>
              <div class="value">${sub.auto_renew ? '✅ Yes' : '❌ No'}</div>
            </div>
            <div class="sub-meta-item">
              <div class="label">Meals/Day</div>
              <div class="value">${sub.plan.meals_per_day}</div>
            </div>
          </div>

          <div style="margin-top:16px;padding:12px;background:#faf7f3;border-radius:var(--radius)">
            <div style="font-size:0.82rem;color:var(--color-text-muted)">Plan Description</div>
            <div style="font-size:0.9rem;margin-top:4px">${sub.plan.description}</div>
          </div>

          <div id="cancel-result" style="margin-top:12px"></div>

          <div class="sub-actions" style="margin-top:16px">
            <button class="btn btn-danger" onclick="handleCancelFromSubPage()" id="btn-cancel-sub-page">
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div>
        <div class="stat-card" style="margin-bottom:16px">
          <div class="stat-label">Wallet Balance</div>
          <div class="stat-value">${formatINR(customer.wallet)}</div>
          <div class="stat-sub">Available for renewal</div>
        </div>
        <div class="card">
          <div class="card-title">ℹ️ Plan Info</div>
          <div style="font-size:0.875rem;display:flex;flex-direction:column;gap:8px;color:var(--color-text-muted)">
            <div>🍽️ ${sub.plan.meals_per_day} meal${sub.plan.meals_per_day > 1 ? 's' : ''} per day</div>
            <div>${sub.plan.veg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}</div>
            <div>📅 Valid until ${formatDate(sub.end_date)}</div>
          </div>
          <div style="margin-top:14px">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('findTiffin')">Browse Other Vendors</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderNoSub() {
  return `
    <div class="card" style="text-align:center;padding:48px">
      <div style="font-size:3rem;margin-bottom:12px">📭</div>
      <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:8px">No Active Subscription</h2>
      <p style="color:var(--color-text-muted);margin-bottom:20px">You don't have an active meal plan subscription yet.</p>
      <button class="btn btn-primary" onclick="navigateTo('findTiffin')">Find a Tiffin Plan</button>
    </div>
  `;
}

async function handleCancelFromSubPage() {
  if (!confirm('Are you sure you want to cancel your subscription?')) return;
  const btn = document.getElementById('btn-cancel-sub-page');
  btn.disabled = true;
  btn.textContent = 'Cancelling...';

  const resultDiv = document.getElementById('cancel-result');
  resultDiv.innerHTML = `
    <div class="process-steps">
      <div class="process-step" id="cs-1"><span class="step-icon running">⟳</span> Cancelling subscription...</div>
      <div class="process-step" id="cs-2"><span class="step-icon pending">⏳</span> Updating status...</div>
    </div>
  `;

  const delay = ms => new Promise(r => setTimeout(r, ms));
  try {
    await delay(500);
    markStep('cs-1', 'done', '✓');
    await delay(400);
    await cancelSubscription();
    markStep('cs-2', 'done', '✓');

    setTimeout(() => {
      resultDiv.innerHTML += '<div class="alert alert-success" style="margin-top:10px">Subscription cancelled successfully. Status: CANCELLED</div>';
      setTimeout(() => renderMySubscription(), 1500);
    }, 200);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Cancel Subscription';
    resultDiv.innerHTML = '<div class="alert alert-error">' + err.message + '</div>';
  }
}
