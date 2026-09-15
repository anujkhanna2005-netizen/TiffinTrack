// ============================================================
// TiffinTrack - Authentication Portal (Sign In & Sign Up)
// public/js/pages/roleSwitcher.js
// ============================================================

let currentAuthTab = 'login'; // 'login' | 'signup'

function renderRoleSwitcher() {
  showContent(`
    <div class="auth-portal-container" style="max-width:540px;margin:36px auto;padding:10px">
      
      <!-- Brand Header -->
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:2.8rem;margin-bottom:6px">🍱</div>
        <h1 style="font-size:1.85rem;font-weight:800;color:var(--color-text);margin:0">TiffinTrack</h1>
        <p style="color:var(--color-text-muted);font-size:0.95rem;margin-top:6px">
          Campus Tiffin Subscription & Delivery Platform
        </p>
      </div>

      <!-- Auth Card -->
      <div class="card" style="box-shadow:var(--shadow-md);border-radius:12px;padding:28px 24px">
        
        <!-- Toggle Tabs -->
        <div style="display:flex;border-bottom:2px solid var(--color-border);margin-bottom:22px;gap:8px">
          <button class="btn ${currentAuthTab === 'login' ? 'btn-primary' : 'btn-ghost'}"
            style="flex:1;border-radius:6px 6px 0 0;font-weight:600"
            onclick="setAuthTab('login')" id="tab-login">
            🔐 Sign In
          </button>
          <button class="btn ${currentAuthTab === 'signup' ? 'btn-primary' : 'btn-ghost'}"
            style="flex:1;border-radius:6px 6px 0 0;font-weight:600"
            onclick="setAuthTab('signup')" id="tab-signup">
            📝 Create Account
          </button>
        </div>

        <div id="auth-form-area">
          ${currentAuthTab === 'login' ? renderLoginForm() : renderSignupForm()}
        </div>

      </div>

    </div>
  `);
}

function setAuthTab(tab) {
  currentAuthTab = tab;
  renderRoleSwitcher();
}

function renderLoginForm() {
  return `
    <div id="login-alert"></div>
    <form onsubmit="handlePortalLogin(event)">
      <div class="form-group">
        <label for="login-email" style="font-weight:600">Email Address</label>
        <input type="email" id="login-email" class="form-control" placeholder="admin@tiffintrack.demo" required autofocus />
      </div>

      <div class="form-group">
        <label for="login-password" style="font-weight:600">Password</label>
        <input type="password" id="login-password" class="form-control" placeholder="••••••••" required />
      </div>

      <button type="submit" class="btn btn-primary" id="btn-login" style="width:100%;margin-top:12px;padding:11px;font-size:0.95rem;font-weight:600">
        Sign In
      </button>
    </form>
  `;
}

function renderSignupForm() {
  return `
    <div id="signup-alert"></div>
    <form onsubmit="handlePortalSignup(event)">
      <div class="form-group">
        <label for="signup-role" style="font-weight:600">Account Type</label>
        <select id="signup-role" class="form-control" onchange="toggleSignupFields(this.value)">
          <option value="student">Student (Customer)</option>
          <option value="vendor">Tiffin Vendor / Kitchen</option>
        </select>
      </div>

      <div class="form-group">
        <label for="signup-name" style="font-weight:600">Full Name / Kitchen Name</label>
        <input type="text" id="signup-name" class="form-control" placeholder="e.g. Rahul Sharma" required />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label for="signup-email" style="font-weight:600">Email Address</label>
          <input type="email" id="signup-email" class="form-control" placeholder="user@example.com" required />
        </div>
        <div class="form-group">
          <label for="signup-phone" style="font-weight:600">Phone Number</label>
          <input type="tel" id="signup-phone" class="form-control" placeholder="9876543210" required />
        </div>
      </div>

      <div class="form-group">
        <label for="signup-password" style="font-weight:600">Password</label>
        <input type="password" id="signup-password" class="form-control" placeholder="At least 6 characters" required minlength="6" />
      </div>

      <!-- Student Fields -->
      <div id="fields-student">
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px">
          <div class="form-group">
            <label for="signup-residence" style="font-weight:600">Hostel / Flat</label>
            <input type="text" id="signup-residence" class="form-control" placeholder="e.g. Ganga Hostel, Block B" />
          </div>
          <div class="form-group">
            <label for="signup-room" style="font-weight:600">Room No</label>
            <input type="text" id="signup-room" class="form-control" placeholder="e.g. 204" />
          </div>
        </div>
        <div class="form-group">
          <label for="signup-locality" style="font-weight:600">Campus Locality</label>
          <input type="text" id="signup-locality" class="form-control" placeholder="e.g. Campus Area / Indrapuri" />
        </div>
      </div>

      <!-- Vendor Fields -->
      <div id="fields-vendor" style="display:none">
        <div class="form-group">
          <label for="signup-address" style="font-weight:600">Kitchen Address</label>
          <input type="text" id="signup-address" class="form-control" placeholder="e.g. Plot 14, Zone II, MP Nagar" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label for="signup-cuisine" style="font-weight:600">Cuisine</label>
            <input type="text" id="signup-cuisine" class="form-control" placeholder="e.g. North Indian" />
          </div>
          <div class="form-group">
            <label for="signup-vlocality" style="font-weight:600">Locality</label>
            <input type="text" id="signup-vlocality" class="form-control" placeholder="e.g. MP Nagar" />
          </div>
        </div>
      </div>

      <button type="submit" class="btn btn-primary" id="btn-signup" style="width:100%;margin-top:12px;padding:11px;font-size:0.95rem;font-weight:600">
        Create Account & Sign In
      </button>
    </form>
  `;
}

function toggleSignupFields(role) {
  document.getElementById('fields-student').style.display = (role === 'student' || role === 'customer') ? 'block' : 'none';
  document.getElementById('fields-vendor').style.display = (role === 'vendor') ? 'block' : 'none';
}

async function handlePortalLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const alertDiv = document.getElementById('login-alert');
  const btn = document.getElementById('btn-login');

  btn.disabled = true;
  btn.textContent = 'Verifying credentials...';
  alertDiv.innerHTML = '';

  try {
    const res = await authLogin(email, password);
    showToast('Login Successful', `Welcome back, ${res.user.email}!`, 'success');
    setupAuthenticatedView(res.user.role, res.user);
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

async function handlePortalSignup(e) {
  e.preventDefault();
  const role = document.getElementById('signup-role').value;
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const password = document.getElementById('signup-password').value;
  const alertDiv = document.getElementById('signup-alert');
  const btn = document.getElementById('btn-signup');

  const userData = { role, name, email, phone, password };

  if (role === 'student' || role === 'customer') {
    userData.pg_or_flat_name = document.getElementById('signup-residence').value.trim() || 'Hostel Campus';
    userData.room_no = document.getElementById('signup-room').value.trim() || '101';
    userData.locality = document.getElementById('signup-locality').value.trim() || 'Campus Area';
  } else if (role === 'vendor') {
    userData.kitchen_address = document.getElementById('signup-address').value.trim() || 'Kitchen St';
    userData.cuisine_type = document.getElementById('signup-cuisine').value.trim() || 'North Indian';
    userData.locality = document.getElementById('signup-vlocality').value.trim() || 'Market';
  } else if (role === 'agent' || role === 'delivery_agent') {
    userData.vehicle_type = document.getElementById('signup-vehicle').value;
    userData.locality = document.getElementById('signup-alocality').value.trim() || 'Campus Area';
  }

  btn.disabled = true;
  btn.textContent = 'Registering...';
  alertDiv.innerHTML = '';

  try {
    const res = await authSignup(userData);
    if (res.pendingApproval) {
      showToast('Registration Submitted', 'Your account is pending Admin approval. Once approved, you can sign in.', 'info');
      setAuthTab('login');
      setTimeout(() => {
        const loginAlert = document.getElementById('login-alert');
        if (loginAlert) {
          loginAlert.innerHTML = `
            <div class="alert alert-info" style="margin-bottom:14px">
              ⏳ <strong>Registration Submitted!</strong><br>
              Your account (${email}) has been submitted for <strong>Administrator Verification & Approval</strong>. You will be able to sign in as soon as the Admin approves your account.
            </div>
          `;
        }
        const emailInput = document.getElementById('login-email');
        if (emailInput) emailInput.value = email;
      }, 50);
    } else {
      showToast('Registration Complete', 'Account registered and signed in.', 'success');
      setupAuthenticatedView(res.user.role, res.user);
    }
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}
