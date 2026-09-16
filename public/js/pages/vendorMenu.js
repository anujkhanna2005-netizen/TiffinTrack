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
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span class="badge" style="background:#e8f5e9;color:#15803d;font-weight:700">Kitchen Management</span>
          <span style="font-size:0.8rem;color:var(--color-text-muted)">• Daily Specials</span>
        </div>
        <h1 style="font-size:1.6rem;font-weight:800;color:var(--color-text);margin:0">🍽️ Today's Menu & Kitchen Specials</h1>
        <p style="color:var(--color-text-muted);margin-top:4px;font-size:0.88rem">
          ${today} &nbsp;•&nbsp; ${menu.published ? '<span style="color:var(--color-success);font-weight:700">✅ Published & Live</span>' : '<span style="color:var(--color-warning);font-weight:700">⏳ Draft / Not Published</span>'}
        </p>
      </div>
      <div style="display:flex;gap:10px">
        ${!menu.published ? `
          <button class="btn btn-primary" onclick="handlePublishMenu()" id="btn-publish" style="display:flex;align-items:center;gap:6px;padding:10px 18px;font-weight:700;box-shadow:var(--shadow-sm)">
            <span>✅</span> Publish Menu to Students
          </button>
        ` : `
          <span class="badge badge-success" style="padding:8px 16px;font-size:0.88rem;border-radius:9999px">✓ Live on Campus</span>
        `}
      </div>
    </div>

    <!-- ADD-ON 2: VENDOR COMMUNITY DISH VOTES WIDGET -->
    <div class="card" style="margin-bottom:24px;border-left:4px solid var(--color-primary);background:var(--color-surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px">
        <div>
          <div class="card-title" style="margin-bottom:3px;font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px">
            <span class="icon">🗳️</span> Student Dish Voting Tally
          </div>
          <p style="font-size:0.85rem;color:var(--color-text-muted);margin:0">Live votes cast by active diners for upcoming community choice dishes.</p>
        </div>
        <div>
          <span class="badge badge-info" style="font-size:0.85rem;padding:6px 12px;font-weight:700;border-radius:9999px">🗳️ ${totalVotes} Total Vote${totalVotes === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div id="voted-dish-alert"></div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:12px">
        ${votes.map(v => {
          const isWinner = winningDish && winningDish.dish_name === v.dish_name && v.vote_count > 0;
          return `
            <div style="border:1.5px solid ${isWinner ? 'var(--color-primary)' : 'var(--color-border)'};border-radius:var(--radius);padding:14px;background:${isWinner ? 'rgba(21,128,61,0.04)' : 'var(--color-surface)'};display:flex;flex-direction:column;justify-content:space-between;box-shadow:var(--shadow-sm)">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <strong style="font-size:0.95rem;color:var(--color-text)">${isWinner ? '👑 ' : '🍛 '}${escapeHtml(v.dish_name)}</strong>
                  <span class="badge ${isWinner ? 'badge-success' : 'badge-pill'}" style="font-size:0.75rem;font-weight:700">${v.vote_count} vote${v.vote_count === 1 ? '' : 's'} (${v.vote_percent}%)</span>
                </div>
                <!-- Progress bar -->
                <div style="height:8px;background:var(--color-border);border-radius:9999px;margin:10px 0;overflow:hidden">
                  <div style="height:100%;width:${v.vote_percent}%;background:${isWinner ? 'var(--color-success)' : 'var(--color-primary)'};border-radius:9999px;transition:width 0.4s ease"></div>
                </div>
              </div>
              <div style="margin-top:10px">
                <button class="btn btn-outline btn-sm" style="width:100%;font-size:0.8rem;padding:6px 10px;font-weight:600;border-radius:6px;border-color:var(--color-primary);color:var(--color-primary)" onclick="handleAddVotedDishToMenu('${escapeHtml(v.dish_name)}')">
                  ➕ Add to Today's Menu
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px">
      <!-- Menu Items -->
      <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--color-border)">
          <div class="card-title" style="margin-bottom:0;font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px">
            <span class="icon">📋</span> Current Published Inclusions (${menu.items.length})
          </div>
        </div>

        <div id="menu-alert"></div>

        ${menu.items.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Item Name</th><th>Category</th><th>Serving Portion</th><th>Action</th></tr></thead>
              <tbody id="menu-table-body">
                ${menu.items.map(item => renderMenuTableRow(item)).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state" style="padding:36px 16px">
            <div class="empty-icon" style="font-size:2.5rem;margin-bottom:8px">🍽️</div>
            <h3 style="font-size:1.1rem;font-weight:700">No items added yet</h3>
            <p style="font-size:0.85rem;color:var(--color-text-muted)">Add dishes to today's menu using the form on the right or the community voting tally above.</p>
          </div>
        `}
      </div>

      <!-- Add Item Form -->
      <div class="card" style="border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);height:fit-content">
        <div class="card-title" style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:14px">
          <span class="icon">➕</span> Add Custom Dish
        </div>
        <div id="add-item-alert"></div>

        <div class="form-group" style="margin-bottom:12px">
          <label for="item-name" style="font-weight:600;font-size:0.85rem;margin-bottom:4px;display:block">Item / Dish Name</label>
          <input type="text" id="item-name" class="form-control" placeholder="e.g. Shahi Paneer" />
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label for="item-category" style="font-weight:600;font-size:0.85rem;margin-bottom:4px;display:block">Category</label>
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
        <div class="form-group" style="margin-bottom:16px">
          <label for="item-quantity" style="font-weight:600;font-size:0.85rem;margin-bottom:4px;display:block">Quantity / Serving Size</label>
          <input type="text" id="item-quantity" class="form-control" placeholder="e.g. 250ml bowl, 4 pcs" />
        </div>
        <button class="btn btn-primary" onclick="handleAddMenuItem()" id="btn-add-item" style="width:100%;font-weight:700;padding:10px">
          + Add Item
        </button>
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
