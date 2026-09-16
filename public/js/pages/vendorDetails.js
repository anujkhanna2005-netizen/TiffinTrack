// ============================================================
// TiffinTrack - Vendor Details & Meal Plans Page
// public/js/pages/vendorDetails.js
// ============================================================

async function renderVendorDetails(vendorId) {
  showLoading();
  try {
    const [vendor, subscription] = await Promise.all([
      getVendorById(vendorId),
      getSubscription()
    ]);

    const hasActiveSub = subscription !== null && subscription.status === 'active';
    const rb = vendor.rating_breakdown;
    const vendorImg = (typeof getVendorImage === 'function') ? getVendorImage(vendor.vendor_id) : '/images/tiffin_homestyle.png';

    showContent(`
      <div class="max-w-6xl mx-auto py-2 flex flex-col gap-6">
        
        <!-- Back Button -->
        <div>
          <button class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-800 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all" onclick="navigateTo('findTiffin')">
            <span class="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Kitchens
          </button>
        </div>

        <!-- Hero Card -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
          <div class="md:w-1/3 h-56 md:h-auto relative overflow-hidden bg-slate-100">
            <img src="${vendorImg}" alt="${vendor.name}" class="w-full h-full object-cover" onerror="this.src='/images/thali_special.png'" />
            <div class="absolute top-3 left-3 flex items-center gap-1 bg-emerald-800 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              <span class="material-symbols-outlined text-[14px]">verified</span>
              Campus Verified
            </div>
          </div>

          <div class="p-6 md:p-8 flex-1 flex flex-col justify-between gap-4">
            <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md mb-2">
                  🍽️ ${vendor.cuisine} Cuisine
                </div>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">${vendor.name}</h1>
                <p class="text-slate-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                  ${vendor.locality}, ${vendor.city} &nbsp;|&nbsp; 📞 ${vendor.contact || 'Direct Dispatch'}
                </p>
                <p class="text-slate-600 text-xs sm:text-sm mt-3 leading-relaxed max-w-xl">
                  ${vendor.description || 'Authentic homestyle Indian meals cooked fresh with minimal spices and pure ingredients.'}
                </p>
              </div>

              <!-- Rating Badge -->
              <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center min-w-[140px] flex flex-col items-center">
                <div class="text-3xl font-extrabold text-slate-900">${vendor.overall_rating ? vendor.overall_rating.toFixed(1) : 'New'}</div>
                <div class="mt-0.5">${renderStars(vendor.overall_rating)}</div>
                <div class="text-[11px] text-slate-500 mt-1">${vendor.rating_breakdown ? vendor.rating_breakdown.count + ' verified reviews' : 'No ratings yet'}</div>
                <div class="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  👥 ${vendor.active_subscribers} active students
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left Column: Menu & Rating Breakdown (7 cols) -->
          <div class="lg:col-span-7 flex flex-col gap-6">
            
            <!-- Today's Published Menu -->
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-700 text-[20px]">lunch_dining</span>
                  Today's Kitchen Menu
                </h3>
                <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                  Freshly Prepared
                </span>
              </div>

              ${vendor.todays_menu && vendor.todays_menu.items && vendor.todays_menu.items.length > 0 ? `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  ${vendor.todays_menu.items.map(item => `
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div class="text-sm font-bold text-slate-800">${item.name}</div>
                        <div class="text-[11px] text-slate-500 uppercase font-semibold mt-0.5">${item.category || 'Dish'}</div>
                      </div>
                      <div class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                        ${item.quantity || 'Standard'}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Daily menu items rotation is published around 10:30 AM every morning.
                </div>
              `}
            </div>

            <!-- Quality & Rating Breakdown -->
            ${rb ? `
              <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 class="font-heading font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <span class="material-symbols-outlined text-amber-500 text-[20px]">insights</span>
                  Quality & Taste Insights
                </h3>
                <div class="space-y-3">
                  ${[['Taste & Flavor', rb.taste], ['Hygiene & Cleanliness', rb.hygiene], ['Punctuality & Warmth', rb.punctuality], ['Value for Money', rb.value]].map(([label, val]) => `
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
              </div>
            ` : ''}

            <!-- Recent Reviews -->
            ${vendor.recent_ratings && vendor.recent_ratings.length > 0 ? `
              <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 class="font-heading font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-700 text-[20px]">rate_review</span>
                  Student Feedback & Reviews
                </h3>
                <div class="space-y-3">
                  ${vendor.recent_ratings.map(r => `
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <div class="flex justify-between items-center text-xs">
                        <span class="font-bold text-slate-800">Verified Campus Hosteller</span>
                        <span class="text-slate-400">${formatDate(r.created_at)}</span>
                      </div>
                      <div>${renderStars(0.35 * r.taste_score + 0.25 * r.hygiene_score + 0.25 * r.punctuality_score + 0.15 * r.value_score)}</div>
                      <p class="text-xs text-slate-600 leading-relaxed">${r.review || 'Great food quality and timely deliveries.'}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

          </div>

          <!-- Right Column: Meal Plans (5 cols) -->
          <div class="lg:col-span-5 flex flex-col gap-4">
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 class="font-heading font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-700 text-[20px]">loyalty</span>
                Available Monthly Plans
              </h3>

              <div class="space-y-4">
                ${vendor.meal_plans.map(plan => `
                  <div class="p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 transition-all bg-slate-50/50 flex flex-col justify-between gap-3">
                    <div>
                      <div class="flex justify-between items-start">
                        <h4 class="font-bold text-slate-900 text-sm font-heading">${plan.name}</h4>
                        <span class="text-xs font-bold ${plan.veg ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'} px-2 py-0.5 rounded">
                          ${plan.veg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </div>
                      <div class="text-base font-extrabold text-emerald-800 mt-1">
                        ${formatINR(plan.price)}<span class="text-xs font-normal text-slate-500"> / month</span>
                      </div>
                      <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">${plan.description || 'Nutritious homestyle meals with rotation.'}</p>
                    </div>

                    <button class="btn btn-primary btn-sm w-full text-xs font-bold"
                      ${hasActiveSub ? 'disabled title="Cancel current active plan first"' : ''}
                      onclick="openSubscribeModal('${vendor.vendor_id}')"
                      id="btn-plan-sub-${plan.plan_id}">
                      ${hasActiveSub ? 'Subscribed' : 'Subscribe via COD'}
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

        </div>

      </div>
    `);
  } catch (err) {
    showError('Failed to load vendor: ' + err.message);
  }
}
