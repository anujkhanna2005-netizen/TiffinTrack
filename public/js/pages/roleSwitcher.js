// ============================================================
// TiffinTrack - Campus Authentication Suite (Sign In & Sign Up)
// public/js/pages/roleSwitcher.js
// ============================================================

let currentAuthTab = 'login'; // 'login' | 'signup'

function renderRoleSwitcher() {
  showContent(`
    <div class="max-w-md mx-auto py-12 px-4">
      
      <!-- Brand & Hero Greeting -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 text-2xl shadow-sm mb-3">
          🍱
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
          Welcome to <span class="text-emerald-700">TiffinTrack</span>
        </h1>
        <p class="text-slate-600 text-xs sm:text-sm mt-1.5 max-w-sm mx-auto">
          Campus Tiffin & Meal Management Platform
        </p>
      </div>

      <!-- Authentication Card -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md">
        
        <!-- Toggle Tabs -->
        <div class="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button class="flex-1 py-2 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${currentAuthTab === 'login' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}"
            onclick="setAuthTab('login')" id="tab-login">
            <span class="material-symbols-outlined text-[16px]">login</span>
            Sign In
          </button>
          <button class="flex-1 py-2 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${currentAuthTab === 'signup' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}"
            onclick="setAuthTab('signup')" id="tab-signup">
            <span class="material-symbols-outlined text-[16px]">person_add</span>
            Create Account
          </button>
        </div>

        <div id="auth-form-area">
          ${currentAuthTab === 'login' ? renderLoginForm() : renderSignupForm()}
        </div>

      </div>

      <!-- Footer Help Notice -->
      <div class="text-center mt-6 text-xs text-slate-500">
        Need help? Contact support or your campus dining administrator.
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
    <form onsubmit="handlePortalLogin(event)" class="space-y-4">
      <div>
        <label for="login-email" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span>
          <input type="email" id="login-email" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="e.g. student@tiffintrack.demo" required autofocus />
        </div>
      </div>

      <div>
        <label for="login-password" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
          <input type="password" id="login-password" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="••••••••" required />
        </div>
      </div>

      <button type="submit" class="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2" id="btn-login">
        <span>Sign In to Campus Portal</span>
        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </form>
  `;
}

function renderSignupForm() {
  return `
    <div id="signup-alert"></div>
    <form onsubmit="handlePortalSignup(event)" class="space-y-4">
      <div>
        <label for="signup-role" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Account Role</label>
        <select id="signup-role" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" onchange="toggleSignupFields(this.value)">
          <option value="student">Student (Customer)</option>
          <option value="vendor">Tiffin Vendor / Kitchen</option>
        </select>
      </div>

      <div>
        <label for="signup-name" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name / Kitchen Name</label>
        <input type="text" id="signup-name" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="e.g. Rahul Sharma" required />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label for="signup-email" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
          <input type="email" id="signup-email" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="user@campus.edu" required />
        </div>
        <div>
          <label for="signup-phone" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number</label>
          <input type="tel" id="signup-phone" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="9876543210" required />
        </div>
      </div>

      <div>
        <label for="signup-password" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
        <input type="password" id="signup-password" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="At least 6 characters" required minlength="6" />
      </div>

      <!-- Student Fields -->
      <div id="fields-student" class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label for="signup-residence" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Hostel / PG Name</label>
            <input type="text" id="signup-residence" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="e.g. Aravali Hostel, Block B" />
          </div>
          <div>
            <label for="signup-room" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Room No</label>
            <input type="text" id="signup-room" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="302" />
          </div>
        </div>
        <div>
          <label for="signup-locality" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Campus Locality / Landmark</label>
          <input type="text" id="signup-locality" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="e.g. North Campus / Indrapuri" />
        </div>
      </div>

      <!-- Vendor Fields -->
      <div id="fields-vendor" style="display:none" class="space-y-3">
        <div>
          <label for="signup-address" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Kitchen Physical Address</label>
          <input type="text" id="signup-address" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="e.g. Plot 14, Zone II, MP Nagar" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="signup-cuisine" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Cuisine Specialization</label>
            <input type="text" id="signup-cuisine" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="e.g. North Indian Homestyle" />
          </div>
          <div>
            <label for="signup-vlocality" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Kitchen Locality</label>
            <input type="text" id="signup-vlocality" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all" placeholder="e.g. MP Nagar" />
          </div>
        </div>
      </div>

      <button type="submit" class="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-4" id="btn-signup">
        <span>Create Account & Continue</span>
        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </form>
  `;
}

function toggleSignupFields(role) {
  const sf = document.getElementById('fields-student');
  const vf = document.getElementById('fields-vendor');
  if (sf) sf.style.display = (role === 'student' || role === 'customer') ? 'block' : 'none';
  if (vf) vf.style.display = (role === 'vendor') ? 'block' : 'none';
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
