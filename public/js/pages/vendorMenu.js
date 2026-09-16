// ============================================================
// TiffinTrack - Vendor Today's Menu Page
// public/js/pages/vendorMenu.js
// ============================================================

let currentVendorId = null;

async function renderVendorMenu() {
  showLoading();
  try {
    const data = await getVendorData();
    currentVendorId = data.vendor ? data.vendor.vendor_id : null;
    const [menu, voteData] = await Promise.all([
      getVendorMenu(currentVendorId),
      getVendorMenuVotes(currentVendorId).catch(() => ({ total_votes: 0, votes: [], winning_dish: null }))
    ]);
    renderMenuPage(menu, voteData);
  } catch (err) {
    showError('Failed to load menu: ' + err.message);
  }
}

function renderMenuPage(menu, voteData) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const votes = (voteData && voteData.votes) ? voteData.votes : [];
  const totalVotes = voteData ? voteData.total_votes : 0;
  const winningDish = voteData ? voteData.winning_dish : null;

  showContent(`
    <div class="page-header">
      <h1>🍽️ Today's Menu & Kitchen Specials</h1>
      <p>${today} ${menu.published ? '• <span style="color:var(--color-success)">✅ Published</span>' : '• <span style="color:var(--color-warning)">⏳ Not Published</span>'}</p>
    </div>

    <!-- ADD-ON 2: VENDOR COMMUNITY DISH VOTES WIDGET -->
    <div class="card" style="margin-bottom:20px;border-left:4px solid var(--color-primary)">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div>
          <div class="card-title" style="margin-bottom:2px"><span class="icon">🗳️</span> Student Dish Voting Tally</div>
          <p style="font-size:0.85rem;color:var(--color-text-muted);margin:0">Live votes cast by your active diners for tomorrow's community choice.</p>
        </div>
        <div>
          <span class="badge badge-info" style="font-size:0.85rem">🗳️ ${totalVotes} Total Vote${totalVotes === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div id="voted-dish-alert"></div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:10px">
        ${votes.map(v => {
          const isWinner = winningDish && winningDish.dish_name === v.dish_name && v.vote_count > 0;
          return `
            <div style="border:1px solid ${isWinner ? 'var(--color-primary)' : 'var(--color-border)'};border-radius:var(--radius);padding:12px;background:${isWinner ? 'var(--color-surface-hover)' : 'var(--color-surface)'};display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <strong style="font-size:0.92rem">${isWinner ? '👑 ' : '🍛 '}${escapeHtml(v.dish_name)}</strong>
                  <span class="badge ${isWinner ? 'badge-success' : 'badge-pill'}" style="font-size:0.75rem">${v.vote_count} vote${v.vote_count === 1 ? '' : 's'} (${v.vote_percent}%)</span>
                </div>
                <!-- Progress bar -->
                <div style="height:6px;background:var(--color-border);border-radius:3px;margin:8px 0;overflow:hidden">
                  <div style="height:100%;width:${v.vote_percent}%;background:${isWinner ? 'var(--color-success)' : 'var(--color-primary)'}"></div>
                </div>
              </div>
              <div style="margin-top:8px">
                <button class="btn btn-outline btn-sm" style="width:100%;font-size:0.78rem;padding:4px 8px" onclick="handleAddVotedDishToMenu('${escapeHtml(v.dish_name)}')">
                  ➕ Add to Today's Menu
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
      <!-- Menu Items -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div class="card-title" style="margin-bottom:0"><span class="icon">📋</span> Menu Items (${menu.items.length})</div>
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
            <p>Add items to today's menu using the form on the right or the community voting widget above.</p>
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
            <option>Community Choice</option>
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
    const result = await addMenuItem(currentVendorId, name, category, quantity);
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
    await deleteMenuItem(currentVendorId, itemId);
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
    await publishMenu(currentVendorId);
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

async function handleAddVotedDishToMenu(dishName) {
  const alertDiv = document.getElementById('voted-dish-alert');
  try {
    const res = await addVotedDishToMenu(dishName, 'Community Choice', '1 serving (Voted #1)', currentVendorId);
    if (alertDiv) {
      alertDiv.innerHTML = `<div class="alert alert-success" style="margin-top:8px">✅ Added <strong>${escapeHtml(dishName)}</strong> to today's menu!</div>`;
    }
    showToast('Dish Added', `"${dishName}" added to today's menu!`, 'success');
    setTimeout(() => renderVendorMenu(), 600);
  } catch (err) {
    if (alertDiv) {
      alertDiv.innerHTML = `<div class="alert alert-error" style="margin-top:8px">❌ ${err.message}</div>`;
    }
    showToast('Error', err.message, 'error');
  }
}
