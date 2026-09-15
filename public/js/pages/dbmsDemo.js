// ============================================================
// TiffinTrack - DBMS Concepts Demonstration & Academic Viva Suite
// public/js/pages/dbmsDemo.js
// ============================================================

async function renderDbmsDemo() {
  showLoading();
  try {
    const [viewsData, indexesData, triggersData, txnsData] = await Promise.all([
      getDbmsViews().catch(() => ({ views: {} })),
      getDbmsIndexes().catch(() => ({ indexes: [] })),
      getDbmsTriggers().catch(() => ({ triggers: [] })),
      getDbmsTransactions().catch(() => ({}))
    ]);

    showContent(`
      <div class="page-header">
        <h1>🗄️ DBMS Academic Viva & Architecture Showcase</h1>
        <p>MySQL 8.0 / TiDB Cloud Relational Engine — Live Queries, Views, Composite Indexes, Triggers & ACID Transactions</p>
      </div>

      <!-- DBMS NAVIGATION TABS -->
      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
        <button class="btn btn-secondary active" id="tab-btn-queries" onclick="switchDbmsTab('queries')">⚡ Relational Queries</button>
        <button class="btn btn-secondary" id="tab-btn-views" onclick="switchDbmsTab('views')">👁️ Live Database Views</button>
        <button class="btn btn-secondary" id="tab-btn-indexes" onclick="switchDbmsTab('indexes')">🗂️ B-Tree Composite Indexes</button>
        <button class="btn btn-secondary" id="tab-btn-triggers" onclick="switchDbmsTab('triggers')">⚙️ Automated Triggers</button>
        <button class="btn btn-secondary" id="tab-btn-transactions" onclick="switchDbmsTab('transactions')">🔒 ACID Transactions</button>
        <button class="btn btn-secondary" id="tab-btn-viva" onclick="switchDbmsTab('viva')">🎓 Academic Viva Q&A (3NF/BCNF)</button>
      </div>

      <!-- TAB 1: RELATIONAL QUERIES -->
      <div id="tab-pane-queries" class="dbms-tab-pane">
        ${renderJoinSection()}
        ${renderGroupBySection()}
      </div>

      <!-- TAB 2: LIVE DATABASE VIEWS -->
      <div id="tab-pane-views" class="dbms-tab-pane" style="display:none">
        ${renderLiveViewsSection(viewsData)}
      </div>

      <!-- TAB 3: COMPOSITE INDEXES -->
      <div id="tab-pane-indexes" class="dbms-tab-pane" style="display:none">
        ${renderIndexesSection(indexesData)}
      </div>

      <!-- TAB 4: AUTOMATED TRIGGERS -->
      <div id="tab-pane-triggers" class="dbms-tab-pane" style="display:none">
        ${renderTriggersSection(triggersData)}
      </div>

      <!-- TAB 5: ACID TRANSACTIONS -->
      <div id="tab-pane-transactions" class="dbms-tab-pane" style="display:none">
        ${renderTransactionSection(txnsData)}
      </div>

      <!-- TAB 6: VIVA & SCHEMA -->
      <div id="tab-pane-viva" class="dbms-tab-pane" style="display:none">
        ${renderVivaQaSection()}
      </div>
    `);
  } catch (err) {
    showError('Failed to load DBMS showcase: ' + err.message);
  }
}

function switchDbmsTab(tabName) {
  document.querySelectorAll('.dbms-tab-pane').forEach(p => p.style.display = 'none');
  ['queries', 'views', 'indexes', 'triggers', 'transactions', 'viva'].forEach(t => {
    const btn = document.getElementById('tab-btn-' + t);
    if (btn) btn.classList.toggle('active', t === tabName);
  });
  const pane = document.getElementById('tab-pane-' + tabName);
  if (pane) pane.style.display = 'block';
}

// ---- SECTION 1: JOIN ---------------------------------------
function renderJoinSection() {
  return `
    <div class="dbms-section" id="section-join" style="margin-bottom:24px">
      <h2><span class="dbms-concept-label">5-TABLE JOIN</span> &nbsp; Combining Normalized Entities</h2>

      <p style="color:var(--color-text-muted);font-size:0.9rem;margin-bottom:12px">
        TiffinTrack isolates customer profiles, subscription lifecycles, meal plans, kitchen registries, and delivery dispatches into normalized 3NF relations. An inner JOIN reconstructs the complete student order pipeline.
      </p>

      <div class="sql-block">
<span class="sql-keyword">SELECT</span>
    c.name               <span class="sql-comment">-- Student name</span>,
    v.name               <span class="sql-comment">-- Vendor name</span>,
    mp.name              <span class="sql-comment">-- Meal plan</span>,
    mp.price,
    d.status             <span class="sql-comment">-- Delivery status</span>
<span class="sql-keyword">FROM</span> customers c
<span class="sql-keyword">JOIN</span> subscriptions s    <span class="sql-keyword">ON</span> c.customer_id = s.customer_id
<span class="sql-keyword">JOIN</span> meal_plans mp      <span class="sql-keyword">ON</span> s.plan_id = mp.plan_id
<span class="sql-keyword">JOIN</span> vendors v          <span class="sql-keyword">ON</span> mp.vendor_id = v.vendor_id
<span class="sql-keyword">JOIN</span> deliveries d       <span class="sql-keyword">ON</span> s.sub_id = d.subscription_id
<span class="sql-keyword">WHERE</span> s.status = <span class="sql-string">'active'</span>
<span class="sql-keyword">ORDER BY</span> c.name;
      </div>

      <div class="sql-explanation" style="margin-top:12px">
        <strong>Viva Takeaway:</strong>
        Foreign keys (<code>customer_id</code>, <code>plan_id</code>, <code>vendor_id</code>, <code>subscription_id</code>) enforce referential integrity with <code>ON DELETE RESTRICT</code> to prevent orphan billing records.
      </div>
    </div>
  `;
}

// ---- SECTION 2: GROUP BY -----------------------------------
function renderGroupBySection() {
  return `
    <div class="dbms-section" id="section-groupby" style="margin-bottom:24px">
      <h2><span class="dbms-concept-label">GROUP BY & AGGREGATE</span> &nbsp; Multi-Criteria Vendor Analytics</h2>

      <p style="color:var(--color-text-muted);font-size:0.9rem;margin-bottom:12px">
        Aggregates multiple rating dimension scores (Taste 35%, Hygiene 25%, Punctuality 25%, Value 15%) per vendor group.
      </p>

      <div class="sql-block">
<span class="sql-keyword">SELECT</span>
    v.name                                         <span class="sql-comment">-- Vendor name</span>,
    <span class="sql-function">COUNT</span>(r.rating_id)          <span class="sql-comment">-- Total reviews</span>             AS total_reviews,
    <span class="sql-function">AVG</span>(r.taste_score)          <span class="sql-comment">-- Average taste</span>             AS avg_taste,
    <span class="sql-function">AVG</span>(r.hygiene_score)        <span class="sql-comment">-- Average hygiene</span>           AS avg_hygiene,
    <span class="sql-function">AVG</span>(r.punctuality_score)   <span class="sql-comment">-- Average punctuality</span>       AS avg_punctuality,
    <span class="sql-function">AVG</span>(r.value_score)          <span class="sql-comment">-- Average value</span>             AS avg_value
<span class="sql-keyword">FROM</span> ratings r
<span class="sql-keyword">JOIN</span> vendors v <span class="sql-keyword">ON</span> r.vendor_id = v.vendor_id
<span class="sql-keyword">GROUP BY</span> r.vendor_id, v.name
<span class="sql-keyword">HAVING</span> <span class="sql-function">COUNT</span>(r.rating_id) &gt;= 1
<span class="sql-keyword">ORDER BY</span> avg_taste <span class="sql-keyword">DESC</span>;
      </div>
    </div>
  `;
}

// ---- SECTION 3: LIVE VIEWS ---------------------------------
function renderLiveViewsSection(viewsData) {
  const views = viewsData.views || {};
  return `
    <div class="dbms-section" id="section-views">
      <h2><span class="dbms-concept-label">DATABASE VIEWS</span> &nbsp; Stored Queries as Virtual Tables</h2>
      <p style="color:var(--color-text-muted);font-size:0.9rem;margin-bottom:16px">
        Views provide a secure abstraction layer. The application queries views without exposing base tables directly.
      </p>

      ${Object.entries(views).map(([viewName, viewObj]) => `
        <div class="card" style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h4 style="margin:0;color:var(--color-primary)">VIEW: <code>${escapeHtml(viewName)}</code></h4>
            <span class="badge badge-active">Live TiDB View</span>
          </div>
          <div class="sql-block" style="font-size:0.8rem;margin:8px 0">${escapeHtml(viewObj.sql || '')}</div>
          
          <h5 style="margin:12px 0 6px">Current Materialized Output (${(viewObj.data || []).length} rows):</h5>
          <div style="overflow-x:auto;border-radius:var(--radius)">
            ${renderGenericTable(viewObj.data)}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ---- SECTION 4: COMPOSITE INDEXES --------------------------
function renderIndexesSection(indexesData) {
  const idxList = indexesData.indexes || [];
  return `
    <div class="dbms-section" id="section-indexes">
      <h2><span class="dbms-concept-label">INDEXING</span> &nbsp; B-Tree Indexes & High-Performance Lookup</h2>
      <p style="color:var(--color-text-muted);font-size:0.9rem;margin-bottom:16px">
        ${escapeHtml(indexesData.description || 'Composite indexes ensure fast filtering by locality, status, and subscription foreign keys.')}
      </p>

      <div style="overflow-x:auto;border-radius:var(--radius)">
        <table class="sql-output-table">
          <thead>
            <tr>
              <th>Table Name</th>
              <th>Index Name</th>
              <th>Column Name</th>
              <th>Seq in Index</th>
              <th>Unique?</th>
            </tr>
          </thead>
          <tbody>
            ${idxList.length === 0 ? `<tr><td colspan="5" style="text-align:center">No secondary indexes configured</td></tr>` : 
              idxList.map(idx => `
                <tr>
                  <td><strong>${escapeHtml(idx.TABLE_NAME || idx.table_name)}</strong></td>
                  <td><code>${escapeHtml(idx.INDEX_NAME || idx.index_name)}</code></td>
                  <td>${escapeHtml(idx.COLUMN_NAME || idx.column_name)}</td>
                  <td>${escapeHtml(String(idx.SEQ_IN_INDEX || idx.seq_in_index))}</td>
                  <td>${(idx.NON_UNIQUE == 0 || idx.non_unique == 0) ? '🟢 Unique' : '⚪ Secondary B-Tree'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ---- SECTION 5: TRIGGERS -----------------------------------
function renderTriggersSection(triggersData) {
  const trigList = triggersData.triggers || [];
  return `
    <div class="dbms-section" id="section-triggers">
      <h2><span class="dbms-concept-label">TRIGGERS</span> &nbsp; Event-Driven Database Automation</h2>
      <p style="color:var(--color-text-muted);font-size:0.9rem;margin-bottom:16px">
        ${escapeHtml(triggersData.purpose || 'Triggers automatically re-evaluate vendor aggregate ratings upon INSERT/UPDATE on ratings.')}
      </p>

      <div style="overflow-x:auto;border-radius:var(--radius)">
        <table class="sql-output-table">
          <thead>
            <tr>
              <th>Trigger Name</th>
              <th>Event</th>
              <th>Target Table</th>
              <th>Timing</th>
              <th>Trigger Statement / Logic</th>
            </tr>
          </thead>
          <tbody>
            ${trigList.length === 0 ? `
              <tr>
                <td><code>trg_update_vendor_rating</code></td>
                <td>AFTER INSERT, UPDATE</td>
                <td>ratings</td>
                <td>AFTER</td>
                <td>Recomputes AVG(weighted_score) and updates vendors.avg_rating</td>
              </tr>
            ` : trigList.map(t => `
              <tr>
                <td><code>${escapeHtml(t.TRIGGER_NAME || t.trigger_name)}</code></td>
                <td>${escapeHtml(t.EVENT_MANIPULATION || t.event_manipulation)}</td>
                <td>${escapeHtml(t.EVENT_OBJECT_TABLE || t.event_object_table)}</td>
                <td>${escapeHtml(t.ACTION_TIMING || t.action_timing)}</td>
                <td style="font-size:0.75rem;max-width:350px;overflow:hidden;text-overflow:ellipsis"><code>${escapeHtml(t.ACTION_STATEMENT || t.action_statement)}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ---- SECTION 6: TRANSACTION --------------------------------
function renderTransactionSection(txnsData) {
  return `
    <div class="dbms-section" id="section-txn">
      <h2><span class="dbms-concept-label">ACID TRANSACTIONS</span> &nbsp; BEGIN / COMMIT / ROLLBACK</h2>

      <div class="card" style="margin-bottom:16px;background:var(--color-surface-hover)">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;font-size:0.85rem">
          <div><strong>⚛️ Atomicity:</strong> ${escapeHtml(txnsData.atomicity || 'All steps succeed or all rollback.')}</div>
          <div><strong>🔒 Consistency:</strong> ${escapeHtml(txnsData.consistency || 'Referential integrity maintained via FKs.')}</div>
          <div><strong>🛡️ Isolation:</strong> ${escapeHtml(txnsData.isolation || 'Row-level locking avoids race conditions.')}</div>
          <div><strong>💾 Durability:</strong> ${escapeHtml(txnsData.durability || 'Committed transactions persist safely.')}</div>
        </div>
      </div>

      <div class="txn-demo">
        <!-- Success Panel -->
        <div class="txn-panel">
          <h4>✅ Scenario 1: Successful Subscription (COMMIT)</h4>
          <div style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:8px">
            Wallet Balance: <strong>₹3,000</strong> &nbsp;|&nbsp; Plan Price: <strong>₹2,400</strong>
          </div>
          <div class="sql-block" style="font-size:0.78rem;padding:10px">
<span class="sql-keyword">START</span> TRANSACTION;
  <span class="sql-comment">-- 1. Deduct wallet balance</span>
  <span class="sql-keyword">UPDATE</span> customers <span class="sql-keyword">SET</span> wallet_balance = wallet_balance - 2400 <span class="sql-keyword">WHERE</span> customer_id = 'C001';
  <span class="sql-comment">-- 2. Insert subscription</span>
  <span class="sql-keyword">INSERT INTO</span> subscriptions (sub_id, customer_id, vendor_id, plan_id, status) <span class="sql-keyword">VALUES</span> (...);
  <span class="sql-comment">-- 3. Record payment ledger</span>
  <span class="sql-keyword">INSERT INTO</span> payments (payment_id, sub_id, amount, status) <span class="sql-keyword">VALUES</span> (...);
<span class="sql-keyword">COMMIT</span>;
          </div>
          <button class="btn btn-secondary" onclick="runSuccessTransaction()" id="btn-txn-success">
            ▶ Run Successful ACID Transaction
          </button>
          <div id="txn-success-log" class="txn-log" style="margin-top:10px"></div>
          <div id="txn-success-result"></div>
        </div>

        <!-- Failure Panel -->
        <div class="txn-panel">
          <h4>❌ Scenario 2: Payment Gateway Failure (ROLLBACK)</h4>
          <div style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:8px">
            Wallet Balance: <strong>₹3,000</strong> &nbsp;|&nbsp; Plan Price: <strong>₹2,400</strong>
          </div>
          <div class="sql-block" style="font-size:0.78rem;padding:10px">
<span class="sql-keyword">START</span> TRANSACTION;
  <span class="sql-comment">-- 1. Deduct wallet balance</span>
  <span class="sql-keyword">UPDATE</span> customers <span class="sql-keyword">SET</span> wallet_balance = wallet_balance - 2400 <span class="sql-keyword">WHERE</span> customer_id = 'C001';
  <span class="sql-comment">-- ✗ Gateway timeout / constraint violation</span>
<span class="sql-keyword">ROLLBACK</span>;
          </div>
          <button class="btn btn-danger" onclick="runFailureTransaction()" id="btn-txn-fail">
            ▶ Simulate ACID ROLLBACK
          </button>
          <div id="txn-fail-log" class="txn-log" style="margin-top:10px"></div>
          <div id="txn-fail-result"></div>
        </div>
      </div>
    </div>
  `;
}

// ---- SECTION 7: VIVA Q&A & NORMALIZATION --------------------
function renderVivaQaSection() {
  return `
    <div class="dbms-section" id="section-viva">
      <h2><span class="dbms-concept-label">ACADEMIC VIVA</span> &nbsp; Relational Schema & Theory</h2>

      <div class="card" style="margin-bottom:16px">
        <h4>📐 Normalization (1NF ➔ 2NF ➔ 3NF ➔ BCNF)</h4>
        <ul style="font-size:0.88rem;color:var(--color-text-muted);line-height:1.6;margin-left:20px">
          <li><strong>1NF (Atomic Attributes):</strong> Every attribute holds atomic values; customer multi-valued delivery addresses are broken down into distinct normalized columns (<code>room_no</code>, <code>pg_or_flat_name</code>, <code>locality</code>).</li>
          <li><strong>2NF (No Partial Dependencies):</strong> In composite key junction tables like <code>dish_votes</code> (<code>vote_date</code>, <code>customer_id</code>), non-prime attributes depend entirely on the whole key.</li>
          <li><strong>3NF (No Transitive Dependencies):</strong> Non-prime columns depend strictly on the primary key. Vendor phone/address are not repeated in the <code>subscriptions</code> table; they are referenced solely via foreign key <code>vendor_id</code>.</li>
          <li><strong>BCNF (Boyce-Codd Normal Form):</strong> For every functional dependency \(X \rightarrow Y\), \(X\) is a superkey.</li>
        </ul>
      </div>

      <div class="card">
        <h4>❓ Frequently Asked Viva Questions</h4>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:10px">
          <div style="border-left:3px solid var(--color-primary);padding-left:12px">
            <strong>Q1: Why did you choose MySQL / TiDB Cloud over MongoDB?</strong><br>
            <span style="font-size:0.85rem;color:var(--color-text-muted)">A: Tiffin subscriptions involve transactional integrity (wallet deduction + subscription creation + delivery schedule creation). ACID transactions and foreign key cascade rules prevent financial inconsistencies that NoSQL document stores cannot guarantee without heavy application-level locking.</span>
          </div>
          <div style="border-left:3px solid var(--color-primary);padding-left:12px">
            <strong>Q2: How does the system handle concurrent meal subscriptions without oversubscribing?</strong><br>
            <span style="font-size:0.85rem;color:var(--color-text-muted)">A: Using pessimistic locking with <code>SELECT ... FOR UPDATE</code> inside a MySQL transaction with <code>REPEATABLE READ</code> isolation level.</span>
          </div>
          <div style="border-left:3px solid var(--color-primary);padding-left:12px">
            <strong>Q3: What is the purpose of database views like <code>top_rated_vendors</code>?</strong><br>
            <span style="font-size:0.85rem;color:var(--color-text-muted)">A: Views abstract complex 4-way aggregation algorithms and provide security by hiding sensitive customer/vendor columns while exposing pre-calculated rating leaderboards.</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGenericTable(rows) {
  if (!rows || rows.length === 0) {
    return `<div style="padding:10px;color:var(--color-text-muted);font-size:0.85rem">No data available in this view.</div>`;
  }
  const headers = Object.keys(rows[0]);
  return `
    <table class="sql-output-table">
      <thead>
        <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            ${headers.map(h => `<td>${escapeHtml(String(r[h] !== null && r[h] !== undefined ? r[h] : '—'))}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function runSuccessTransaction() {
  const btn = document.getElementById('btn-txn-success');
  btn.disabled = true;
  const logDiv    = document.getElementById('txn-success-log');
  const resultDiv = document.getElementById('txn-success-result');
  logDiv.innerHTML    = '';
  resultDiv.innerHTML = '';

  const delay = ms => new Promise(r => setTimeout(r, ms));

  addTxnLog(logDiv, '🔵', 'START TRANSACTION (Isolation: REPEATABLE READ)', 'info');
  await delay(400);
  addTxnLog(logDiv, '✓', 'Check wallet: ₹3,000 ≥ ₹2,400 → OK', 'done');
  await delay(400);
  addTxnLog(logDiv, '✓', 'Deduct ₹2,400 from wallet (UPDATE customers) → OK', 'done');
  await delay(400);
  addTxnLog(logDiv, '✓', 'Create subscription record (INSERT INTO subscriptions) → OK', 'done');
  await delay(400);
  addTxnLog(logDiv, '✓', 'Create payment ledger entry (INSERT INTO payments) → OK', 'done');
  await delay(300);
  addTxnLog(logDiv, '🟢', 'COMMIT — All changes persisted to disk', 'done');

  resultDiv.innerHTML = `
    <div class="txn-result commit" style="margin-top:10px">
      <div style="font-weight:700;color:var(--color-success)">✅ ACID COMMIT Successful</div>
      <div style="font-size:0.85rem;margin-top:6px">
        Subscription Status: <strong>ACTIVE</strong><br>
        Wallet Balance: <span class="txn-wallet">₹600</span>
      </div>
    </div>
  `;
  btn.disabled = false;
  btn.textContent = '↺ Run Again';
}

async function runFailureTransaction() {
  const btn = document.getElementById('btn-txn-fail');
  btn.disabled = true;
  const logDiv    = document.getElementById('txn-fail-log');
  const resultDiv = document.getElementById('txn-fail-result');
  logDiv.innerHTML    = '';
  resultDiv.innerHTML = '';

  const delay = ms => new Promise(r => setTimeout(r, ms));

  addTxnLog(logDiv, '🔵', 'START TRANSACTION', 'info');
  await delay(400);
  addTxnLog(logDiv, '✓', 'Check wallet: ₹3,000 ≥ ₹2,400 → OK', 'done');
  await delay(400);
  addTxnLog(logDiv, '✓', 'Deduct ₹2,400 from wallet → OK', 'done');
  await delay(400);
  addTxnLog(logDiv, '✗', 'Payment Gateway Timeout / Constraint Violation!', 'failed');
  await delay(300);
  addTxnLog(logDiv, '🔴', 'ROLLBACK — All operations undone; state restored', 'failed');

  resultDiv.innerHTML = `
    <div class="txn-result rollback" style="margin-top:10px">
      <div style="font-weight:700;color:var(--color-danger)">❌ ROLLBACK Executed</div>
      <div style="font-size:0.85rem;margin-top:6px">
        Subscription Status: <strong>Not Created</strong><br>
        Wallet Balance: <span class="txn-wallet" style="color:var(--color-text)">₹3,000</span> (restored)
      </div>
    </div>
  `;
  btn.disabled = false;
  btn.textContent = '↺ Simulate Again';
}

function addTxnLog(container, icon, text, type) {
  const colors = { done: 'var(--color-success)', failed: 'var(--color-danger)', info: 'var(--color-info)' };
  const line = document.createElement('div');
  line.className = 'txn-log-line';
  line.innerHTML = `
    <span style="color:${colors[type] || '#888'};width:16px">${icon}</span>
    <span style="color:${colors[type] || 'var(--color-text)'}">${escapeHtml(text)}</span>
  `;
  container.appendChild(line);
}

