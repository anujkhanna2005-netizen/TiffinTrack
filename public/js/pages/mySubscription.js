// ============================================================
// TiffinTrack - Manage Subscription & Add-ons
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
      <div class="max-w-6xl mx-auto py-2 flex flex-col gap-6">
        
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span class="material-symbols-outlined text-[14px]">event_repeat</span>
              Subscription & Add-ons Center
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Manage Your Active Plan
            </h1>
            <p class="text-slate-500 text-sm mt-1 max-w-xl">
              Customize daily rotis & spice level, skip meals with automatic bill adjustments, unlock flat group discounts, or switch vendors instantly.
            </p>
          </div>

          ${subscription && subscription.status === 'active' ? `
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Active Subscription
              </span>
            </div>
          ` : ''}
        </div>

        ${subscription ? renderSubscriptionDetails(subscription, customer) : renderNoSub()}

      </div>
    `);
  } catch (err) {
    showError('Failed to load subscription: ' + err.message);
  }
}

function renderSubscriptionDetails(sub, customer) {
  const stats = sub.delivery_stats || {
    total_days: sub.total_days || sub.locked_meals_included || (sub.plan ? sub.plan.meals_included : 30) || 30,
    delivered_count: sub.delivered_count || 0,
    skipped_count: sub.skipped_count || 0,
    days_remaining: sub.days_remaining !== undefined ? sub.days_remaining : 24,
    total_refund_credited: sub.total_refund_credited || 0,
    skips: sub.skips || sub.skip_history || []
  };

  const skips = stats.skips || [];
  const delPct = Math.min(100, Math.round((stats.delivered_count / (stats.total_days || 30)) * 100));
  const skipPct = Math.min(100 - delPct, Math.round((stats.skipped_count / (stats.total_days || 30)) * 100));
  const todayStr = new Date().toISOString().slice(0, 10);

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column: Subscription Card + Add-on 1 & Add-on 4 (7 cols) -->
      <div class="lg:col-span-7 flex flex-col gap-6">
        
        <!-- Plan Overview Card -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  ${sub.plan.veg ? '🟢 Pure Veg Plan' : '🔴 Non-Veg Plan'}
                </span>
                <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading mt-1.5">${sub.plan.name}</h2>
                <div class="text-xs text-slate-500 mt-0.5">By <strong>${sub.vendor.name}</strong> • ${sub.vendor.locality}</div>
              </div>

              <div class="text-right">
                <div class="text-xs text-slate-400 font-semibold uppercase">Locked Plan Rate</div>
                <div class="text-xl font-extrabold text-emerald-800">${formatINR(sub.locked_price || sub.plan.price)}<span class="text-xs font-normal text-slate-500">/mo</span></div>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-4">
              <div>
                <div class="text-[11px] text-slate-400 font-bold uppercase">Meals / Day</div>
                <div class="text-sm font-bold text-slate-800 mt-0.5">${sub.plan.meals_per_day || 1} meal(s)</div>
              </div>
              <div>
                <div class="text-[11px] text-slate-400 font-bold uppercase">Meals Remaining</div>
                <div class="text-sm font-bold text-emerald-700 mt-0.5">${stats.days_remaining} left</div>
              </div>
              <div>
                <div class="text-[11px] text-slate-400 font-bold uppercase">Validity Window</div>
                <div class="text-xs font-semibold text-slate-700 mt-0.5">${formatDate(sub.start_date)} - ${formatDate(sub.end_date)}</div>
              </div>
            </div>

            <div class="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60 mb-4">
              ${sub.plan.description || 'Nutritious homestyle meals cooked fresh daily.'}
            </div>
          </div>

          <div id="cancel-result"></div>

          <div class="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <button class="btn btn-outline btn-sm text-xs font-semibold flex items-center gap-1.5" onclick="openSwitchVendorModal('${sub.vendor_id}')">
              <span class="material-symbols-outlined text-[16px]">swap_horiz</span>
              One-Click Switch Vendor (ACID)
            </button>
            <button class="btn btn-danger btn-sm text-xs font-semibold flex items-center gap-1.5" onclick="handleCancelFromSubPage()" id="btn-cancel-sub-page">
              <span class="material-symbols-outlined text-[16px]">cancel</span>
              Cancel Subscription
            </button>
          </div>
        </div>

        <!-- DELIVERY ACCOUNTING & SKIP LEDGER CARD -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-700 text-[22px]">inventory_2</span>
                Meal Delivery & Skip Accounting Ledger
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Accurate record of delivered meals, approved skips, and remaining service days.</p>
            </div>
            <span class="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              Live Delivery Counter
            </span>
          </div>

          <!-- 4-Box Metric Counter Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-center">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plan Total</div>
              <div class="text-2xl font-black text-slate-900 font-heading mt-1">${stats.total_days}</div>
              <div class="text-[11px] text-slate-500 font-medium">Meals Included</div>
            </div>
            <div class="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-center">
              <div class="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Delivered</div>
              <div class="text-2xl font-black text-emerald-700 font-heading mt-1">${stats.delivered_count}</div>
              <div class="text-[11px] text-emerald-800 font-medium">Meals Served</div>
            </div>
            <div class="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center">
              <div class="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Skipped</div>
              <div class="text-2xl font-black text-amber-700 font-heading mt-1">${stats.skipped_count}</div>
              <div class="text-[11px] text-amber-800 font-medium">₹${(stats.total_refund_credited || stats.skipped_count * 80).toFixed(2)} Credited</div>
            </div>
            <div class="bg-blue-50 rounded-2xl p-4 border border-blue-200 text-center">
              <div class="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Remaining</div>
              <div class="text-2xl font-black text-blue-700 font-heading mt-1">${stats.days_remaining}</div>
              <div class="text-[11px] text-blue-800 font-medium">Meals to Deliver</div>
            </div>
          </div>

          <!-- Progress Bar Breakdown -->
          <div>
            <div class="flex justify-between text-xs font-semibold mb-1.5 text-slate-600">
              <span>Fulfillment Progress</span>
              <span>${delPct}% Completed (${stats.delivered_count}/${stats.total_days})</span>
            </div>
            <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200">
              <div style="width:${delPct}%;" class="bg-emerald-600 rounded-full" title="${stats.delivered_count} Delivered"></div>
              <div style="width:${skipPct}%;" class="bg-amber-500 rounded-full" title="${stats.skipped_count} Skipped"></div>
            </div>
            <div class="flex items-center gap-4 text-[11px] text-slate-500 mt-2 flex-wrap">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Delivered (${stats.delivered_count})</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Skipped / Credited (${stats.skipped_count})</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block"></span> Remaining (${stats.days_remaining})</span>
            </div>
          </div>

          <!-- Skip & Credit History Log -->
          <div class="pt-2 border-t border-slate-100">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-amber-600">history</span>
              Meal Skip & Refund Ledger (${skips.length} Skips Requested)
            </h4>

            ${skips.length === 0 ? `
              <div class="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No meals skipped yet. You can use the form below to skip upcoming meals and get automatic refunds credited to your COD bill.
              </div>
            ` : `
              <div class="overflow-x-auto rounded-2xl border border-slate-200">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th class="p-3">Skip Date</th>
                      <th class="p-3">Reason Stated</th>
                      <th class="p-3">Refund Credited</th>
                      <th class="p-3 text-right">Accounting Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${skips.map(sk => `
                      <tr class="hover:bg-slate-50/50">
                        <td class="p-3 font-bold text-slate-900">${formatDate(sk.date)}</td>
                        <td class="p-3 text-slate-600">${escapeHtml(sk.reason || 'Personal plans')}</td>
                        <td class="p-3 font-bold text-emerald-700">₹${(parseFloat(sk.refund_amount) || 80).toFixed(2)}</td>
                        <td class="p-3 text-right">
                          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            ✓ Deducted from COD Bill
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>

        <!-- ADD-ON 1: SKIP / PAUSE MEAL -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-600 text-[20px]">pause_circle</span>
              Add-on 1: Pause & Skip Meal (Instant Bill Credit)
            </h3>
            <span class="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">Per-meal Deduction</span>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed">
            Going home for the weekend or dining out? Skip today's or tomorrow's meal and receive an automatic <strong>billing deduction</strong> computed directly from your plan's rate.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="skip-date" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Skip Date</label>
              <input type="date" id="skip-date" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" value="${todayStr}" min="${todayStr}" />
            </div>
            <div>
              <label for="skip-meal" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Meal Window</label>
              <select id="skip-meal" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600">
                <option value="lunch">Lunch Service</option>
                <option value="dinner">Dinner Service</option>
              </select>
            </div>
            <div>
              <label for="skip-reason" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Reason</label>
              <input type="text" id="skip-reason" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" placeholder="e.g. Weekend at home" />
            </div>
          </div>

          <div id="skip-alert"></div>

          <button class="btn btn-primary btn-sm text-xs font-bold w-full sm:w-auto" onclick="handleSkipMealSubmit()" id="btn-skip-submit">
            ✓ Request Skip & Deduct From COD Bill
          </button>
        </div>

        <!-- ADD-ON 4: MEAL CUSTOMIZATION & PREFERENCES -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-700 text-[20px]">tune</span>
              Add-on 4: Meal Customization & Spice Preferences
            </h3>
            <span class="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Live Kitchen Dispatch</span>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed">
            Set your daily cooking preferences for the vendor. Active subscription preferences are transmitted directly to the kitchen terminal for daily preparation.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="pref-spice" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Spice Level</label>
              <select id="pref-spice" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600">
                <option value="low" ${(sub.spice_level === 'low' || customer.spice_level === 'low') ? 'selected' : ''}>🌶️ Low Spice / Mild</option>
                <option value="medium" ${(sub.spice_level === 'medium' || customer.spice_level === 'medium' || (!sub.spice_level && !customer.spice_level)) ? 'selected' : ''}>🌶️🌶️ Medium Spice (Standard)</option>
                <option value="high" ${(sub.spice_level === 'high' || customer.spice_level === 'high') ? 'selected' : ''}>🌶️🌶️🌶️ High Spice (Desi Tadka)</option>
                <option value="jain" ${(sub.spice_level === 'jain' || customer.spice_level === 'jain') ? 'selected' : ''}>🌱 Jain (No Onion / Garlic)</option>
              </select>
            </div>
            <div>
              <label for="pref-roti" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bread / Add-on Preference</label>
              <select id="pref-roti" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600">
                <option value="standard" ${(sub.bread_preference === 'standard' || customer.bread_preference === 'standard' || (!sub.bread_preference && !customer.bread_preference)) ? 'selected' : ''}>Standard Roti Count (4 Phulkas)</option>
                <option value="extra_roti" ${(sub.bread_preference === 'extra_roti' || customer.bread_preference === 'extra_roti') ? 'selected' : ''}>🍞 +1 Extra Butter Roti</option>
                <option value="rice_only" ${(sub.bread_preference === 'rice_only' || customer.bread_preference === 'rice_only') ? 'selected' : ''}>🍚 Extra Rice instead of Rotis</option>
              </select>
            </div>
          </div>

          <div>
            <label for="pref-notes" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Special Cooking Instructions (Max 200 chars)</label>
            <input type="text" id="pref-notes" maxlength="200" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" placeholder="e.g. Less oil in dal, extra salad, warm packaging" value="${escapeHtml(sub.special_instructions || customer.special_instructions || '')}" />
          </div>

          <div id="pref-alert"></div>

          <button class="btn btn-outline btn-sm text-xs font-bold" onclick="handleSavePreferences()" id="btn-pref-submit">
            💾 Save Preferences to Kitchen
          </button>
        </div>

      </div>

      <!-- Right Column: Payment Status & Add-on 3 Flat Group Savings (5 cols) -->
      <div class="lg:col-span-5 flex flex-col gap-6">
        
        <!-- Payment & COD Status Card -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Ledger</span>
              <span class="badge ${sub.payment_status === 'collected' ? 'badge-success' : 'badge-pending'}">
                ${sub.payment_status === 'collected' ? 'Payment Collected' : 'Pending COD Collection'}
              </span>
            </div>

            <div class="text-xs text-slate-500 mb-1">Current Amount Due (COD)</div>
            <div class="text-3xl font-extrabold text-amber-700 font-heading mb-2" id="amount-due-val">
              ${formatINR(sub.amount_due)}
            </div>
            
            <div class="space-y-2 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Base Plan Price</span>
                <span class="font-bold text-slate-900">${formatINR(sub.locked_price || sub.plan.price)}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Group Discount Applied</span>
                <span class="font-bold text-emerald-700">${sub.group_id ? 'Active Tier' : '0%'}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Payment Mode</span>
                <span class="font-bold text-slate-800">Cash on Delivery / UPI</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ADD-ON 3: FLAT / GROUP SUBSCRIPTION -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
              <span class="material-symbols-outlined text-purple-600 text-[20px]">groups</span>
              Add-on 3: Flat Group Savings
            </h3>
            <span class="text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">5% - 10% Off</span>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed">
            Coordinate with roommates in your hostel flat: <strong>3-4 members</strong> unlock a <strong>5% discount</strong>, and <strong>5+ members</strong> unlock a <strong>10% discount</strong> on pending COD bills!
          </p>

          <div>
            <label for="group-code-input" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Join Group by Code</label>
            <div class="flex gap-2">
              <input type="text" id="group-code-input" class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 uppercase font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" placeholder="e.g. FLAT4B" onkeydown="if(event.key==='Enter'){handleJoinGroup();}" />
              <button class="btn btn-primary btn-sm text-xs font-bold px-4" id="btn-join-group" onclick="handleJoinGroup()">Join</button>
            </div>

            <div class="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
              <span>Quick demo codes:</span>
              <a href="#" onclick="setAndJoinGroup('FLAT4B');return false;" class="font-mono font-bold text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded hover:bg-emerald-50">FLAT4B</a>
              <a href="#" onclick="setAndJoinGroup('HOSTEL-A');return false;" class="font-mono font-bold text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded hover:bg-emerald-50">HOSTEL-A</a>
              <a href="#" onclick="setAndJoinGroup('ROOM302');return false;" class="font-mono font-bold text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded hover:bg-emerald-50">ROOM302</a>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100">
            <button class="btn btn-outline btn-sm text-xs font-bold w-full" onclick="handleCreateFlatGroup('${customer.residence || 'Campus PG'}')">
              ➕ Create New Flat Group
            </button>
          </div>

          <div id="group-alert"></div>
        </div>

      </div>

    </div>
  `;
}

function renderNoSub() {
  return `
    <div class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
      <div class="text-4xl mb-3">📭</div>
      <h2 class="text-xl font-extrabold text-slate-900 font-heading">No Active Subscription</h2>
      <p class="text-xs text-slate-500 mt-1 mb-6">You do not have an active meal plan subscription at the moment.</p>
      <button class="btn btn-primary btn-sm text-xs font-bold" onclick="navigateTo('findTiffin')">Browse Tiffin Kitchens</button>
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

// Add-on 1: Handle Skip Meal
async function handleSkipMealSubmit() {
  const skipDate = document.getElementById('skip-date').value;
  const mealType = document.getElementById('skip-meal').value;
  const reason   = document.getElementById('skip-reason').value.trim() || 'Personal plans';
  const alertDiv = document.getElementById('skip-alert');
  const btn      = document.getElementById('btn-skip-submit');

  if (!skipDate) {
    alertDiv.innerHTML = '<div class="alert alert-warning">Please select a valid skip date.</div>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Processing adjustment...';

  try {
    const res = await skipMeal(skipDate, mealType, reason);
    const newDue = res.new_amount_due !== undefined ? res.new_amount_due : res.amount_due;
    const perMeal = res.per_meal_cost !== undefined ? res.per_meal_cost : 80;

    const amountEl = document.getElementById('amount-due-val');
    if (amountEl && newDue !== undefined) {
      amountEl.textContent = formatINR(newDue);
    }

    alertDiv.innerHTML = `
      <div class="alert alert-success" style="margin-top:10px">
        ✅ <strong>Meal Skipped Successfully!</strong><br>
        ₹${parseFloat(perMeal).toFixed(2)} deducted from bill. Updated Amount Due: <strong>${formatINR(newDue)}</strong>.
      </div>
    `;
    showToast('Skip Confirmed', `Amount due adjusted by ₹${parseFloat(perMeal).toFixed(2)}.`, 'success');
    btn.textContent = '✓ Skipped';
    setTimeout(() => renderMySubscription(), 1500);
  } catch (err) {
    alertDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
    btn.disabled = false;
    btn.textContent = '✓ Request Skip & Adjust Amount Due';
  }
}


// Add-on 4: Handle Meal Customization
async function handleSavePreferences() {
  const spice = document.getElementById('pref-spice').value;
  const roti  = document.getElementById('pref-roti').value;
  const notes = document.getElementById('pref-notes').value.trim();
  const alertDiv = document.getElementById('pref-alert');
  const btn = document.getElementById('btn-pref-submit');

  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    await updateMealPreferences({ spice_level: spice, bread_preference: roti, special_notes: notes });
    alertDiv.innerHTML = '<div class="alert alert-success" style="margin-top:10px">✅ Cooking preferences saved and sent to your vendor kitchen.</div>';
    showToast('Preferences Saved', 'Vendor kitchen notified.', 'success');
    btn.disabled = false;
    btn.textContent = '💾 Save Preferences';
  } catch (err) {
    alertDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
    btn.disabled = false;
    btn.textContent = '💾 Save Preferences';
  }
}

// Add-on 3: Handle Flat Groups
async function handleJoinGroup() {
  const input = document.getElementById('group-code-input');
  const code = input ? input.value.trim().toUpperCase() : '';
  const alertDiv = document.getElementById('group-alert');
  const btn = document.getElementById('btn-join-group');

  if (!code) {
    if (alertDiv) alertDiv.innerHTML = '<div class="alert alert-warning" style="font-size:0.8rem">Please enter a group code (e.g. FLAT4B or GRP001).</div>';
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Joining...';
  }

  try {
    const res = await joinGroupSubscription(code);
    const count = res.member_count || 1;
    const isUnlocked = res.discount_unlocked;
    const needed = res.members_remaining || Math.max(0, 3 - count);
    const pct = res.discount_percentage || (count >= 5 ? 15 : (count >= 3 ? 10 : 0));

    if (alertDiv) {
      alertDiv.innerHTML = `
        <div class="alert ${isUnlocked ? 'alert-success' : 'alert-info'}" style="font-size:0.82rem;margin-top:8px;line-height:1.4">
          <div style="font-weight:700;margin-bottom:4px">
            ${isUnlocked ? '🎉 10% Flat Group Discount UNLOCKED!' : '👥 Group Joined — Needs 3+ Members'}
          </div>
          <div>Group: <strong>${escapeHtml(res.group_name || code)}</strong> (Code: <code>${escapeHtml(res.group_code || code)}</code>)</div>
          <div style="margin:6px 0">
            <strong>Members: ${count}/3 minimum</strong> 
            ${isUnlocked ? '✅ Target Reached!' : `(⚠️ Need ${needed} more roommate${needed > 1 ? 's' : ''} to activate discount)`}
          </div>
          <div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;overflow:hidden;margin:6px 0">
            <div style="background:${isUnlocked ? 'var(--color-success)' : 'var(--color-primary)'};height:100%;width:${Math.min(100, Math.round((count / 3) * 100))}%"></div>
          </div>
          ${!isUnlocked ? `
            <div style="margin-top:8px;display:flex;gap:6px;align-items:center">
              <button class="btn btn-sm btn-outline" style="font-size:0.75rem;padding:3px 8px" onclick="setAndJoinGroup('${escapeHtml(res.group_code || code)}')">
                ➕ Simulate Roommate Join (+1)
              </button>
              <span style="font-size:0.75rem;color:var(--color-text-muted)">Share code with flatmates</span>
            </div>
          ` : `
            <div style="color:var(--color-success);font-weight:600;font-size:0.8rem;margin-top:4px">
              ✓ Active on your monthly meal plan renewals
            </div>
          `}
        </div>
      `;
    }
    showToast(isUnlocked ? 'Discount Unlocked!' : 'Group Joined', res.message, isUnlocked ? 'success' : 'info');
  } catch (err) {
    if (alertDiv) alertDiv.innerHTML = `<div class="alert alert-error" style="font-size:0.8rem;margin-top:8px">❌ ${escapeHtml(err.message)}</div>`;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Join';
    }
  }
}

function setAndJoinGroup(code) {
  const input = document.getElementById('group-code-input');
  if (input) {
    input.value = code;
    handleJoinGroup();
  }
}

async function handleCreateFlatGroup(residence) {
  const groupName = prompt('Enter a name for your flat group (e.g. Flat 302 Squad):', 'Flat Roommates Group');
  if (!groupName) return;
  const alertDiv = document.getElementById('group-alert');
  try {
    const res = await createGroupSubscription(groupName, residence);
    const code = res.group_code || res.group_id || (res.group && res.group.group_code) || 'GRP001';
    
    const inputEl = document.getElementById('group-code-input');
    if (inputEl) inputEl.value = code;

    alertDiv.innerHTML = `
      <div class="alert alert-info" style="font-size:0.82rem;line-height:1.4;margin-top:8px">
        <div style="font-weight:700;margin-bottom:4px">👥 Flat Group Created!</div>
        <div>Group Name: <strong>${escapeHtml(res.group_name || groupName)}</strong></div>
        <div>Share Code: <strong style="letter-spacing:1px;font-size:0.95rem;color:var(--color-primary)">${escapeHtml(code)}</strong></div>
        <div style="margin-top:6px;font-size:0.8rem;color:var(--color-text-muted)">
          <strong>Members: 1/3</strong> — Share this code with at least <strong>2 more roommates</strong> in your flat to unlock the 10% discount!
        </div>
        <div style="margin-top:8px">
          <button class="btn btn-sm btn-outline" style="font-size:0.75rem;padding:3px 8px" onclick="setAndJoinGroup('${escapeHtml(code)}')">
            ➕ Simulate Roommate Join (+1)
          </button>
        </div>
      </div>
    `;
    showToast('Group Created', 'Share code: ' + code + ' with 2 roommates', 'info');
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert alert-error" style="font-size:0.8rem;margin-top:8px">❌ ${escapeHtml(err.message)}</div>`;
  }
}

// Add-on 5: One-Click Instant Vendor Switch
async function openSwitchVendorModal(currentVendorId) {
  try {
    const vendors = await getVendors();
    const otherVendors = vendors.filter(v => v.vendor_id !== currentVendorId);

    if (otherVendors.length === 0) {
      showToast('No Other Vendors', 'No alternative vendors available right now.', 'info');
      return;
    }

    const modalHtml = `
      <div class="modal-overlay" id="switch-modal-overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal" style="max-width:500px">
          <button class="modal-close" onclick="closeModal()">×</button>
          <h3>🔄 Switch Tiffin Vendor</h3>
          <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:14px">
            Switch your subscription seamlessly using ACID transaction without losing remaining days.
          </p>
          <div class="form-group">
            <label for="switch-vendor-select" style="font-weight:600">Choose New Vendor</label>
            <select id="switch-vendor-select" class="form-control" onchange="updateSwitchPlanOptions(this.value)">
              ${otherVendors.map(v => `<option value="${v.vendor_id}">${v.name} (${v.locality}) — ${v.cuisine}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="switch-plan-select" style="font-weight:600">Choose Meal Plan</label>
            <select id="switch-plan-select" class="form-control">
              <!-- Populated dynamically -->
            </select>
          </div>
          <div class="form-group">
            <label for="switch-reason" style="font-weight:600">Reason for Switching</label>
            <input type="text" id="switch-reason" class="form-control" placeholder="e.g. Trying new cuisine" />
          </div>
          <div id="switch-result"></div>
          <div class="modal-actions" style="margin-top:16px">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="confirmVendorSwitch()" id="btn-confirm-switch">Confirm Instant Switch</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    updateSwitchPlanOptions(otherVendors[0].vendor_id);
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function updateSwitchPlanOptions(vendorId) {
  const planSelect = document.getElementById('switch-plan-select');
  if (!planSelect) return;
  try {
    const plans = await getVendorMealPlans(vendorId);
    planSelect.innerHTML = plans.map(p => `
      <option value="${p.plan_id}">${p.name} — ${formatINR(p.price)}/mo (${p.veg ? '🟢 Veg' : '🔴 Non-Veg'})</option>
    `).join('');
  } catch (e) {
    planSelect.innerHTML = '<option value="">No plans found</option>';
  }
}

async function confirmVendorSwitch() {
  const vendorId = document.getElementById('switch-vendor-select').value;
  const planId   = document.getElementById('switch-plan-select').value;
  const reason   = document.getElementById('switch-reason').value.trim() || 'Switched by student';
  const resultDiv = document.getElementById('switch-result');
  const btn = document.getElementById('btn-confirm-switch');

  if (!vendorId || !planId) {
    resultDiv.innerHTML = '<div class="alert alert-warning">Please select a vendor and meal plan.</div>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Switching in Transaction...';

  try {
    const res = await switchVendor(vendorId, planId, reason);
    resultDiv.innerHTML = `
      <div class="alert alert-success" style="margin-top:10px">
        ✅ <strong>Vendor Switched Successfully!</strong><br>
        Transaction Committed. New Vendor: <strong>${res.new_vendor_name || 'Selected Vendor'}</strong>.
      </div>
    `;
    showToast('Switch Complete', 'Your subscription has been switched!', 'success');
    setTimeout(() => {
      closeModal();
      renderMySubscription();
    }, 1500);
  } catch (err) {
    resultDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
    btn.disabled = false;
    btn.textContent = 'Confirm Instant Switch';
  }
}
