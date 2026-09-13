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
        <div class="page-header"><h1>⭐ Ratings & Reviews</h1></div>
        <div class="card" style="text-align:center;padding:48px">
          <div style="font-size:3rem;margin-bottom:12px">⭐</div>
          <h2 style="font-size:1.1rem;font-weight:700">No Active Subscription</h2>
          <p style="color:var(--color-text-muted)">You need an active subscription to rate a vendor.</p>
          <button class="btn btn-primary" style="margin-top:16px" onclick="navigateTo('findTiffin')">Find a Plan</button>
        </div>
      `);
      return;
    }

    showContent(`
      <div class="page-header">
        <h1>⭐ Rate Your Vendor</h1>
        <p>Rating for <strong>${subscription.vendor.name}</strong></p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <!-- Rating Form -->
        <div class="card">
          <div class="card-title"><span class="icon">✍️</span> Submit a Rating</div>
          <div id="rating-alert"></div>

          ${renderStarRow('taste', 'Taste')}
          ${renderStarRow('hygiene', 'Hygiene')}
          ${renderStarRow('punctuality', 'Punctuality')}
          ${renderStarRow('value', 'Value for Money')}

          <div class="form-group" style="margin-top:8px">
            <label for="review-text">Review (Optional)</label>
            <textarea id="review-text" class="form-control" placeholder="Share your experience..." rows="3"></textarea>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
            <div id="overall-preview" style="font-size:0.875rem;color:var(--color-text-muted)">
              Overall: —
            </div>
            <button class="btn btn-primary" onclick="submitRatingForm('${subscription.vendor_id}')" id="btn-submit-rating">
              Submit Rating
            </button>
          </div>
        </div>

        <!-- Info Card -->
        <div>
          <div class="card" style="margin-bottom:16px">
            <div class="card-title"><span class="icon">📊</span> Rating Formula</div>
            <div style="font-size:0.875rem;color:var(--color-text-muted);line-height:2">
              <div>Taste × <strong>35%</strong></div>
              <div>Hygiene × <strong>25%</strong></div>
              <div>Punctuality × <strong>25%</strong></div>
              <div>Value × <strong>15%</strong></div>
              <div style="margin-top:8px;border-top:1px solid var(--color-border);padding-top:8px;color:var(--color-text)">
                = <strong>Overall Rating</strong>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-title"><span class="icon">🏪</span> Current Vendor</div>
            <div style="font-size:0.9rem">
              <div><strong>${subscription.vendor.name}</strong></div>
              <div style="color:var(--color-text-muted);margin-top:4px">${subscription.vendor.locality}</div>
              <div style="margin-top:8px">${renderStars(null)}</div>
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
