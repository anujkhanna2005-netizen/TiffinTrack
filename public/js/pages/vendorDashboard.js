// ============================================================
// TiffinTrack - Vendor Kitchen Command Portal
// public/js/pages/vendorDashboard.js
// ============================================================

async function renderVendorDashboard() {
  showLoading();
  try {
    const data = await getVendorData();
    const { vendor, stats, rating_breakdown, recent_ratings, complaints, subscribers } = data;

    showContent(`
      <div class="max-w-6xl mx-auto py-2 flex flex-col gap-6">
        
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-emerald-400/20">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Kitchen Terminal Online
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              ${vendor.name}
            </h1>
            <p class="text-emerald-100/80 text-xs sm:text-sm">
              📍 ${vendor.locality}, ${vendor.city} &nbsp;|&nbsp; 🍽️ ${vendor.cuisine} &nbsp;|&nbsp; 📞 ${vendor.contact || 'Direct Line'}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button class="btn btn-outline btn-sm text-xs font-bold bg-white/10 text-white border-white/20 hover:bg-white/20" onclick="navigateTo('vendorMenu')">
              <span class="material-symbols-outlined text-[16px]">restaurant_menu</span>
              Update Menu & Voting
            </button>
            <button class="btn btn-primary btn-sm text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900" onclick="navigateTo('vendorDeliveries')">
              <span class="material-symbols-outlined text-[16px]">local_shipping</span>
              Dispatch Feed
            </button>
          </div>
        </div>

        <!-- KPI STATS CARDS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Subscribers</span>
              <span class="material-symbols-outlined text-emerald-600 text-[20px]">badge</span>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-extrabold text-slate-900">${stats.active_subscribers}</div>
              <div class="text-xs text-slate-500 mt-0.5">Recurring campus meal plans</div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Deliveries</span>
              <span class="material-symbols-outlined text-emerald-600 text-[20px]">lunch_dining</span>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-extrabold text-slate-900">${stats.today_deliveries}</div>
              <div class="text-xs text-slate-500 mt-0.5">Scheduled meal handovers</div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Rating</span>
              <span class="material-symbols-outlined text-amber-500 text-[20px]">star</span>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-extrabold text-amber-600">
                ${stats.overall_rating ? stats.overall_rating.toFixed(1) : '—'}
              </div>
              <div class="text-xs text-slate-500 mt-0.5">${stats.rating_count} student review${stats.rating_count !== 1 ? 's' : ''}</div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Grievances</span>
              <span class="material-symbols-outlined text-purple-600 text-[20px]">support_agent</span>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-extrabold ${stats.pending_complaints > 0 ? 'text-red-600' : 'text-emerald-700'}">
                ${stats.pending_complaints}
              </div>
              <div class="text-xs text-slate-500 mt-0.5">${stats.pending_complaints > 0 ? 'Requires prompt resolution' : 'Zero open tickets'}</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Quality Breakdown (6 cols) -->
          <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-500 text-[20px]">insights</span>
              Quality & Flavor Performance
            </h3>

            ${rating_breakdown ? `
              <div class="space-y-3 pt-2">
                ${[['Taste & Recipe', rating_breakdown.taste], ['Kitchen Hygiene', rating_breakdown.hygiene], ['Delivery Punctuality', rating_breakdown.punctuality], ['Value for Money', rating_breakdown.value]].map(([label, val]) => `
                  <div class="space-y-1">
                    <div class="flex justify-between text-xs font-semibold text-slate-700">
                      <span>${label}</span>
                      <span class="font-bold text-slate-900">${val} / 5.0</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div class="h-full bg-emerald-600 rounded-full" style="width: ${(val / 5) * 100}%"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : '<div class="text-center py-8 text-xs text-slate-400">No ratings recorded yet.</div>'}
          </div>

          <!-- Recent Complaints (6 cols) -->
          <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-purple-600 text-[20px]">report_problem</span>
                Recent Grievances (${complaints.length})
              </h3>
              <button class="text-xs font-bold text-emerald-700 hover:underline" onclick="navigateTo('vendorComplaints')">View All →</button>
            </div>

            ${complaints.length > 0 ? `
              <div class="space-y-2.5">
                ${complaints.slice(0, 4).map(c => `
                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex justify-between items-center text-xs">
                    <div>
                      <div class="font-bold text-slate-900">${c.issue_type}</div>
                      <div class="text-slate-500 mt-0.5">${c.customer_name} • ${formatDate(c.created_at)}</div>
                    </div>
                    <span class="badge badge-${c.status}">${c.status}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                ✅ No unresolved complaints.
              </div>
            `}
          </div>

          <!-- Active Subscribers Table (Full Width) -->
          <div class="lg:col-span-12 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-700 text-[20px]">group</span>
                Active Campus Subscribers (${subscribers.length})
              </h3>
              <button class="btn btn-outline btn-sm text-xs font-bold" onclick="navigateTo('vendorSubscribers')">Manage All Subscribers</button>
            </div>

            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Residence</th>
                    <th>Room</th>
                    <th>Subscribed Plan</th>
                    <th>Start Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${subscribers.slice(0, 6).map(s => `
                    <tr>
                      <td class="font-bold text-slate-900">${s.customer ? s.customer.name : '—'}</td>
                      <td>${s.customer ? s.customer.residence : '—'}</td>
                      <td>${s.customer ? s.customer.room : '—'}</td>
                      <td class="font-semibold text-emerald-800">${s.plan ? s.plan.name : '—'}</td>
                      <td>${formatDate(s.start_date)}</td>
                      <td><span class="badge badge-${s.status}">${s.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    `);
  } catch (err) {
    showError('Failed to load dashboard: ' + err.message);
  }
}
