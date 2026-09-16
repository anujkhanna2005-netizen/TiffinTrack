// ============================================================
// TiffinTrack - Student Ratings Page
// public/js/pages/studentRatings.js
// ============================================================

// Track current star selections
let ratingValues = { taste: 0, hygiene: 0, punctuality: 0, value: 0 };

async function renderStudentRatings() {
  showLoading();
  // Reset rating values
  ratingValues = { taste: 0, hygiene: 0, punctuality: 0, value: 0 };

  try {
    const subscription = await getSubscription();

    if (!subscription) {
      showContent(`
        <div class="max-w-6xl mx-auto py-2">
          <div class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
            <div class="text-4xl mb-3">⭐</div>
            <h2 class="text-xl font-extrabold text-slate-900 font-heading">No Active Subscription</h2>
            <p class="text-xs text-slate-500 mt-1 mb-6">You need an active tiffin meal plan subscription to submit reviews.</p>
            <button class="btn btn-primary btn-sm text-xs font-bold" onclick="navigateTo('findTiffin')">Browse Tiffin Kitchens</button>
          </div>
        </div>
      `);
      return;
    }

    showContent(`
      <div class="max-w-6xl mx-auto py-2 flex flex-col gap-6">
        
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span class="material-symbols-outlined text-[14px]">star</span>
              Quality & Feedback Oversight
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Rate Your Meal Experience
            </h1>
            <p class="text-slate-500 text-sm mt-1">
              Rating for <strong>${subscription.vendor.name}</strong> • ${subscription.plan.name}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Rating Form (7 cols) -->
          <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-500 text-[20px]">rate_review</span>
                Submit Quality Assessment
              </h3>
              <span class="text-xs text-slate-400">Weighted Scoring</span>
            </div>

            <div id="rating-alert"></div>

            <div class="space-y-4 bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
              ${renderStarRow('taste', 'Taste & Flavor (35% weight)')}
              ${renderStarRow('hygiene', 'Hygiene & Cleanliness (25% weight)')}
              ${renderStarRow('punctuality', 'Delivery Warmth & Timing (25% weight)')}
              ${renderStarRow('value', 'Portion Size & Value for Money (15% weight)')}
            </div>

            <div>
              <label for="review-text" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Detailed Review (Optional)</label>
              <textarea id="review-text" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" placeholder="Share your experience with the roti softness, dal thickness, delivery timing..." rows="3"></textarea>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div id="overall-preview" class="text-xs font-bold text-slate-600">
                Calculated Rating: <span class="text-amber-600">—</span>
              </div>
              <button class="btn btn-primary btn-sm text-xs font-bold" onclick="submitRatingForm('${subscription.vendor_id}')" id="btn-submit-rating">
                Submit Quality Review
              </button>
            </div>
          </div>

          <!-- Info & Weighting Card (5 cols) -->
          <div class="lg:col-span-5 flex flex-col gap-6">
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 class="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-700 text-[20px]">calculate</span>
                Campus Rating Matrix
              </h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                TiffinTrack uses a transparent weighted algorithm to maintain kitchen accountability across college hostels:
              </p>
              
              <div class="space-y-2 text-xs">
                <div class="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span class="font-medium text-slate-700">🍛 Taste & Recipe</span>
                  <span class="font-bold text-emerald-800">35%</span>
                </div>
                <div class="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span class="font-medium text-slate-700">🧼 Kitchen Hygiene</span>
                  <span class="font-bold text-emerald-800">25%</span>
                </div>
                <div class="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span class="font-medium text-slate-700">🛵 On-time Delivery</span>
                  <span class="font-bold text-emerald-800">25%</span>
                </div>
                <div class="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span class="font-medium text-slate-700">💰 Value for Money</span>
                  <span class="font-bold text-emerald-800">15%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `);
  } catch (err) {
    showError('Failed to load ratings page: ' + err.message);
  }
}

function renderStarRow(category, label) {
  return `
    <div class="form-group">
      <label>${label}</label>
      <div class="stars-input" id="stars-${category}">
        ${[1,2,3,4,5].map(i => `
          <button class="star-btn" data-val="${i}" onclick="setRating('${category}', ${i})" id="star-${category}-${i}" title="${i} star${i>1?'s':''}">★</button>
        `).join('')}
      </div>
    </div>
  `;
}

function setRating(category, value) {
  ratingValues[category] = value;
  // Update star display
  const container = document.getElementById('stars-' + category);
  container.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.val) <= value);
  });
  updateOverallPreview();
}

function updateOverallPreview() {
  const { taste, hygiene, punctuality, value } = ratingValues;
  if (taste && hygiene && punctuality && value) {
    const overall = 0.35*taste + 0.25*hygiene + 0.25*punctuality + 0.15*value;
    document.getElementById('overall-preview').innerHTML =
      'Overall: <strong>' + overall.toFixed(1) + ' / 5</strong> ' + renderStars(overall);
  }
}

async function submitRatingForm(vendorId) {
  const { taste, hygiene, punctuality, value } = ratingValues;
  const alertDiv = document.getElementById('rating-alert');

  if (!taste || !hygiene || !punctuality || !value) {
    alertDiv.innerHTML = '<div class="alert alert-warning">Please rate all four categories.</div>';
    return;
  }

  const review = document.getElementById('review-text').value;
  const btn    = document.getElementById('btn-submit-rating');
  btn.disabled = true;
  btn.textContent = 'Submitting...';
  alertDiv.innerHTML = '';

  try {
    const result = await submitRating(vendorId, taste, hygiene, punctuality, value, review);
    const overall = 0.35*taste + 0.25*hygiene + 0.25*punctuality + 0.15*value;
    alertDiv.innerHTML = `
      <div class="alert alert-success">
        ✅ Rating submitted! Your overall score: <strong>${overall.toFixed(1)} / 5</strong><br>
        <small>Vendor's new average rating: ${result.updated_vendor_rating ? result.updated_vendor_rating.toFixed(1) : '—'}</small>
      </div>
    `;
    btn.textContent = 'Submitted ✓';
    // Reset form
    ratingValues = { taste: 0, hygiene: 0, punctuality: 0, value: 0 };
    document.getElementById('review-text').value = '';
    document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('overall-preview').innerHTML = 'Overall: —';
  } catch (err) {
    alertDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
    btn.disabled = false;
    btn.textContent = 'Submit Rating';
  }
}
