// ============================================================
// TiffinTrack - Role Switcher Page
// public/js/pages/roleSwitcher.js
// ============================================================

function renderRoleSwitcher() {
  showContent(`
    <div class="role-switcher">
      <div>
        <div class="role-switcher-brand">🍱 TiffinTrack</div>
        <div class="role-switcher-tagline">Tiffin Subscription & Delivery Management</div>
      </div>

      <div>
        <h2>Choose Demo Role</h2>
      </div>

      <div class="role-grid">
        <button class="role-card" onclick="selectRole('student')" id="role-btn-student">
          <span class="role-icon">🎓</span>
          <span>Student</span>
          <span class="role-demo-label">Rahul Sharma</span>
        </button>
        <button class="role-card" onclick="selectRole('vendor')" id="role-btn-vendor">
          <span class="role-icon">🏪</span>
          <span>Vendor</span>
          <span class="role-demo-label">Annapurna Tiffin</span>
        </button>
        <button class="role-card" onclick="selectRole('agent')" id="role-btn-agent">
          <span class="role-icon">🛵</span>
          <span>Delivery Agent</span>
          <span class="role-demo-label">Amit Kumar</span>
        </button>
        <button class="role-card" onclick="selectRole('admin')" id="role-btn-admin">
          <span class="role-icon">🔧</span>
          <span>Admin</span>
          <span class="role-demo-label">TiffinTrack HQ</span>
        </button>
      </div>

      <p style="color:var(--color-text-muted);font-size:0.82rem">
        Demo Mode — Authentication simplified for academic prototype
      </p>
    </div>
  `);
}
