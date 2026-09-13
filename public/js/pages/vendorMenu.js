// ============================================================
// TiffinTrack - Vendor Today's Menu Page
// public/js/pages/vendorMenu.js
// ============================================================

const VENDOR_ID = 'V001'; // Demo vendor

async function renderVendorMenu() {
  showLoading();
  try {
    const menu = await getVendorMenu(VENDOR_ID);
    renderMenuPage(menu);
  } catch (err) {
    showError('Failed to load menu: ' + err.message);
  }
}

function renderMenuPage(menu) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  showContent(`
    <div class="page-header">
      <h1>🍽️ Today's Menu</h1>
      <p>${today} ${menu.published ? '• <span style="color:var(--color-success)">✅ Published</span>' : '• <span style="color:var(--color-warning)">⏳ Not Published</span>'}</p>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
      <!-- Menu Items -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div class="card-title" style="margin-bottom:0"><span class="icon">📋</span> Menu Items</div>
          <div style="display:flex;gap:8px">
            ${!menu.published ? `<button class="btn btn-secondary btn-sm" onclick="handlePublishMenu()" id="btn-publish">✅ Publish Menu</button>` : '<span class="badge badge-success">Published</span>'}
          </div>
        </div>

        <div id="menu-alert"></div>

        ${menu.items.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Actions</th></tr></thead>
              <tbody id="menu-table-body">
                ${menu.items.map(item => renderMenuTableRow(item)).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">🍽️</div>
            <h3>No items yet</h3>
            <p>Add items to today's menu using the form on the right.</p>
          </div>
        `}
      </div>

      <!-- Add Item Form -->
      <div class="card">
        <div class="card-title"><span class="icon">➕</span> Add Menu Item</div>
        <div id="add-item-alert"></div>

        <div class="form-group">
          <label for="item-name">Item Name</label>
          <input type="text" id="item-name" class="form-control" placeholder="e.g. Dal Makhani" />
        </div>
        <div class="form-group">
          <label for="item-category">Category</label>
          <select id="item-category" class="form-control">
            <option>Main</option>
            <option>Bread</option>
            <option>Side</option>
            <option>Salad</option>
            <option>Soup</option>
            <option>Drink</option>
            <option>Dessert</option>
          </select>
        </div>
        <div class="form-group">
          <label for="item-quantity">Quantity / Serving</label>
          <input type="text" id="item-quantity" class="form-control" placeholder="e.g. 200g, 2 pcs" />
        </div>
        <button class="btn btn-primary" onclick="handleAddMenuItem()" id="btn-add-item" style="width:100%">Add Item</button>
      </div>
    </div>
  `);
}

function renderMenuTableRow(item) {
  return `
    <tr id="row-${item.item_id}">
      <td><strong>${item.name}</strong></td>
      <td>${item.category}</td>
      <td>${item.quantity}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-outline btn-sm" onclick="handleDeleteMenuItem('${item.item_id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `;
}

async function handleAddMenuItem() {
  const name     = document.getElementById('item-name').value.trim();
  const category = document.getElementById('item-category').value;
  const quantity = document.getElementById('item-quantity').value.trim();
  const alertDiv = document.getElementById('add-item-alert');

  if (!name) {
    alertDiv.innerHTML = '<div class="alert alert-warning">Please enter an item name.</div>';
    return;
  }

  const btn = document.getElementById('btn-add-item');
  btn.disabled = true;
  btn.textContent = 'Adding...';

  try {
    const result = await addMenuItem(VENDOR_ID, name, category, quantity);
    alertDiv.innerHTML = '<div class="alert alert-success">✅ Item added!</div>';
    document.getElementById('item-name').value = '';
    document.getElementById('item-quantity').value = '';
    // Refresh page
    setTimeout(() => renderVendorMenu(), 500);
  } catch (err) {
    alertDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>';
    btn.disabled = false;
    btn.textContent = 'Add Item';
  }
}

async function handleDeleteMenuItem(itemId) {
  if (!confirm('Delete this menu item?')) return;
  try {
    await deleteMenuItem(VENDOR_ID, itemId);
    const row = document.getElementById('row-' + itemId);
    if (row) row.remove();
    const alertDiv = document.getElementById('menu-alert');
    if (alertDiv) alertDiv.innerHTML = '<div class="alert alert-success">Item deleted.</div>';
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function handlePublishMenu() {
  const btn = document.getElementById('btn-publish');
  btn.disabled = true;
  btn.textContent = 'Publishing...';
  try {
    await publishMenu(VENDOR_ID);
    showToast("✅ Menu published! Students can now see today's menu.", 'success');
    const alertDiv = document.getElementById('menu-alert');
    if (alertDiv) alertDiv.innerHTML = '<div class="alert alert-success">✅ Menu published! Students can now see today\'s menu.</div>';
    btn.textContent = '✅ Published';
    // Refresh after short delay
    setTimeout(() => renderVendorMenu(), 1000);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '✅ Publish Menu';
    showToast('Error: ' + err.message, 'error');
  }
}
