// ============================================================
// TiffinTrack - DBMS Concepts Demonstration Page
// public/js/pages/dbmsDemo.js
//
// Four sections only: JOIN, GROUP BY, VIEW, TRANSACTION
// All SQL is conceptual — demonstrates real relational concepts
// using the same data structures as the mock database.
// ============================================================

function renderDbmsDemo() {
  showContent(`
    <div class="page-header">
      <h1>🗄️ DBMS Concepts Demonstration</h1>
      <p>Preview V1 — Four core DBMS concepts demonstrated with TiffinTrack data</p>
    </div>

    <!-- SECTION 1: JOIN -->
    ${renderJoinSection()}

    <!-- SECTION 2: GROUP BY -->
    ${renderGroupBySection()}

    <!-- SECTION 3: VIEW -->
    ${renderViewSection()}

    <!-- SECTION 4: TRANSACTION -->
    ${renderTransactionSection()}
  `);
}

// ---- SECTION 1: JOIN ---------------------------------------
function renderJoinSection() {
  return `
    <div class="dbms-section" id="section-join">
      <h2><span class="dbms-concept-label">JOIN</span> &nbsp; Combining Related Tables</h2>

      <p style="color:var(--color-text-muted);font-size:0.9rem;margin-bottom:12px">
        TiffinTrack stores data across multiple tables. A JOIN lets us combine them 
        to answer real questions — like "Which student subscribed to which vendor, 
        and what is their delivery status today?"
      </p>

      <div class="sql-block">
<span class="sql-keyword">SELECT</span>
    c.name               <span class="sql-comment">-- Student name</span>,
    v.name               <span class="sql-comment">-- Vendor name</span>,
    mp.name              <span class="sql-comment">-- Meal plan</span>,
    mp.price,
    d.status             <span class="sql-comment">-- Delivery status</span>
<span class="sql-keyword">FROM</span> Customer c
<span class="sql-keyword">JOIN</span> Subscription s
    <span class="sql-keyword">ON</span> c.customer_id = s.customer_id
<span class="sql-keyword">JOIN</span> MealPlan mp
    <span class="sql-keyword">ON</span> s.plan_id = mp.plan_id
<span class="sql-keyword">JOIN</span> Vendor v
    <span class="sql-keyword">ON</span> mp.vendor_id = v.vendor_id
<span class="sql-keyword">JOIN</span> Delivery d
    <span class="sql-keyword">ON</span> s.sub_id = d.sub_id
<span class="sql-keyword">WHERE</span> s.status = <span class="sql-string">'active'</span>
<span class="sql-keyword">ORDER BY</span> c.name;
      </div>

      <p style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:8px">Sample Output (from TiffinTrack mock data):</p>
      <div style="overflow-x:auto;border-radius:var(--radius);overflow:hidden">
        <table class="sql-output-table">
          <thead><tr><th>Student Name</th><th>Vendor</th><th>Plan</th><th>Price (₹)</th><th>Delivery Status</th></tr></thead>
          <tbody>
            <tr><td>Rahul Sharma</td><td>Annapurna Tiffin Services</td><td>Monthly Veg Plan</td><td>2400</td><td>out_for_delivery</td></tr>
            <tr><td>Priya Verma</td><td>HomeTaste Kitchen</td><td>South Indian Monthly</td><td>2200</td><td>delivered</td></tr>
            <tr><td>Arjun Mehta</td><td>Maa's Kitchen</td><td>Full Day Plan</td><td>3200</td><td>pending</td></tr>
            <tr><td>Sneha Patel</td><td>HealthyBite Tiffins</td><td>Health Monthly Plan</td><td>3000</td><td>pending</td></tr>
            <tr><td>Rohit Singh</td><td>Campus Meals</td><td>Budget Monthly Plan</td><td>1800</td><td>delivered</td></tr>
          </tbody>
        </table>
      </div>

      <div class="sql-explanation">
        <strong>Viva Explanation:</strong>
        A <strong>JOIN</strong> combines records from two or more tables based on a related column.
        Here, <code>customer_id</code>, <code>plan_id</code>, <code>vendor_id</code>, and <code>sub_id</code>
        are foreign keys that link the tables. Without JOIN, we would need five separate queries and 
        manually match the results in application code. JOIN does this work inside the database efficiently.
      </div>
    </div>
  `;
}

// ---- SECTION 2: GROUP BY -----------------------------------
function renderGroupBySection() {
  return `
    <div class="dbms-section" id="section-groupby">
      <h2><span class="dbms-concept-label">GROUP BY</span> &nbsp; Aggregating Data Per Vendor</h2>

      <p style="color:var(--color-text-muted);font-size:0.9rem;margin-bottom:12px">
        Instead of looking at individual ratings, we want to calculate the average rating 
        for each vendor. GROUP BY groups all rating rows by vendor and applies AVG() to each group.
      </p>

      <div class="sql-block">
<span class="sql-keyword">SELECT</span>
    v.name                                         <span class="sql-comment">-- Vendor name</span>,
    <span class="sql-function">COUNT</span>(r.rating_id)          <span class="sql-comment">-- Total reviews</span>             AS total_reviews,
    <span class="sql-function">AVG</span>(r.taste_score)          <span class="sql-comment">-- Average taste</span>             AS avg_taste,
    <span class="sql-function">AVG</span>(r.hygiene_score)        <span class="sql-comment">-- Average hygiene</span>           AS avg_hygiene,
    <span class="sql-function">AVG</span>(r.punctuality_score)   <span class="sql-comment">-- Average punctuality</span>       AS avg_punctuality,
    <span class="sql-function">AVG</span>(r.value_score)          <span class="sql-comment">-- Average value</span>             AS avg_value
<span class="sql-keyword">FROM</span> Rating r
<span class="sql-keyword">JOIN</span> Vendor v <span class="sql-keyword">ON</span> r.vendor_id = v.vendor_id
<span class="sql-keyword">GROUP BY</span> r.vendor_id, v.name
<span class="sql-keyword">ORDER BY</span> avg_taste <span class="sql-keyword">DESC</span>;
      </div>

      <p style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:8px">Sample Output:</p>
      <div style="overflow-x:auto;border-radius:var(--radius);overflow:hidden">
        <table class="sql-output-table">
          <thead><tr><th>Vendor</th><th>Reviews</th><th>Avg Taste</th><th>Avg Hygiene</th><th>Avg Punct.</th><th>Avg Value</th></tr></thead>
          <tbody>
            <tr><td>Annapurna Tiffin Services</td><td>3</td><td>4.33</td><td>4.33</td><td>4.00</td><td>4.33</td></tr>
            <tr><td>HomeTaste Kitchen</td><td>2</td><td>4.50</td><td>5.00</td><td>4.50</td><td>4.50</td></tr>
            <tr><td>Maa's Kitchen</td><td>2</td><td>4.50</td><td>4.50</td><td>4.50</td><td>3.50</td></tr>
            <tr><td>HealthyBite Tiffins</td><td>2</td><td>3.50</td><td>5.00</td><td>4.00</td><td>3.00</td></tr>
            <tr><td>Campus Meals</td><td>2</td><td>3.50</td><td>3.50</td><td>3.50</td><td>5.00</td></tr>
          </tbody>
        </table>
      </div>

      <div class="sql-explanation">
        <strong>Viva Explanation:</strong>
        <strong>GROUP BY</strong> collects all rows that share the same <code>vendor_id</code> into a single group.
        Aggregate functions like <strong>AVG()</strong> and <strong>COUNT()</strong> then operate on each group separately.
        This is how TiffinTrack calculates each vendor's average rating score.
        Without GROUP BY, AVG() would calculate across all vendors combined — which would be meaningless.
      </div>
    </div>
  `;
}

// ---- SECTION 3: VIEW ---------------------------------------
function renderViewSection() {
  return `
    <div class="dbms-section" id="section-view">
      <h2><span class="dbms-concept-label">VIEW</span> &nbsp; Saving a Query as a Virtual Table</h2>

      <p style="color:var(--color-text-muted);font-size:0.9rem;margin-bottom:12px">
        A VIEW is a saved SQL query that behaves like a table. Instead of writing the full 
        GROUP BY query every time, we create a view called <code>top_rated_vendors</code> 
        and then query it with a simple SELECT.
      </p>

      <p style="font-size:0.85rem;font-weight:600;margin-bottom:4px">Step 1: Create the View</p>
      <div class="sql-block">
<span class="sql-keyword">CREATE VIEW</span> top_rated_vendors <span class="sql-keyword">AS</span>
<span class="sql-keyword">SELECT</span>
    v.vendor_id,
    v.name,
    v.locality,
    <span class="sql-function">COUNT</span>(r.rating_id)  AS total_reviews,
    <span class="sql-function">ROUND</span>(
        0.35 * <span class="sql-function">AVG</span>(r.taste_score) +
        0.25 * <span class="sql-function">AVG</span>(r.hygiene_score) +
        0.25 * <span class="sql-function">AVG</span>(r.punctuality_score) +
        0.15 * <span class="sql-function">AVG</span>(r.value_score), 2
    ) AS overall_rating
<span class="sql-keyword">FROM</span> Rating r
<span class="sql-keyword">JOIN</span> Vendor v <span class="sql-keyword">ON</span> r.vendor_id = v.vendor_id
<span class="sql-keyword">GROUP BY</span> v.vendor_id, v.name, v.locality;
      </div>

      <p style="font-size:0.85rem;font-weight:600;margin-top:16px;margin-bottom:4px">Step 2: Query the View (simple!)</p>
      <div class="sql-block">
<span class="sql-keyword">SELECT</span> *
<span class="sql-keyword">FROM</span> top_rated_vendors
<span class="sql-keyword">ORDER BY</span> overall_rating <span class="sql-keyword">DESC</span>;
      </div>

      <p style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:8px">Sample Output:</p>
      <div style="overflow-x:auto;border-radius:var(--radius);overflow:hidden">
        <table class="sql-output-table">
          <thead><tr><th>vendor_id</th><th>name</th><th>locality</th><th>total_reviews</th><th>overall_rating</th></tr></thead>
          <tbody>
            <tr><td>V002</td><td>HomeTaste Kitchen</td><td>HSR Layout</td><td>2</td><td>4.50</td></tr>
            <tr><td>V003</td><td>Maa's Kitchen</td><td>Indiranagar</td><td>2</td><td>4.38</td></tr>
            <tr><td>V001</td><td>Annapurna Tiffin Services</td><td>Koramangala</td><td>3</td><td>4.27</td></tr>
            <tr><td>V004</td><td>HealthyBite Tiffins</td><td>BTM Layout</td><td>2</td><td>3.88</td></tr>
            <tr><td>V005</td><td>Campus Meals</td><td>Marathahalli</td><td>2</td><td>3.80</td></tr>
          </tbody>
        </table>
      </div>

      <div class="sql-explanation">
        <strong>Viva Explanation:</strong>
        A <strong>VIEW</strong> is a stored query that appears as a virtual table. The database does not 
        store the actual data — it runs the underlying query every time the view is accessed.
        This is useful because: (1) it simplifies complex queries, (2) it can restrict what columns 
        users can see, and (3) it keeps logic centralised. In TiffinTrack, the 
        <code>top_rated_vendors</code> view is used on the Find Tiffin page to rank vendors.
      </div>
    </div>
  `;
}

// ---- SECTION 4: TRANSACTION --------------------------------
// Tracks transaction demo state (local to demo, not server state)
let txnState = { wallet: 3000, planPrice: 2400 };

function renderTransactionSection() {
  return `
    <div class="dbms-section" id="section-txn">
      <h2><span class="dbms-concept-label">TRANSACTION</span> &nbsp; BEGIN / COMMIT / ROLLBACK</h2>

      <p style="color:var(--color-text-muted);font-size:0.9rem;margin-bottom:12px">
        A TRANSACTION groups multiple SQL statements so that either ALL of them succeed 
        (COMMIT) or NONE of them take effect (ROLLBACK). This protects data from being 
        left in an incomplete state if something goes wrong.
      </p>

      <div class="txn-demo">
        <!-- Success Panel -->
        <div class="txn-panel">
          <h4>✅ Scenario 1: Successful Subscription</h4>
          <div style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:8px">
            Wallet: <strong>₹3,000</strong> &nbsp;|&nbsp; Plan: <strong>₹2,400</strong>
          </div>
          <div class="sql-block" style="font-size:0.78rem;padding:10px">
<span class="sql-keyword">BEGIN</span> TRANSACTION;
  <span class="sql-comment">-- Check wallet balance</span>
  <span class="sql-comment">-- Create subscription record</span>
  <span class="sql-comment">-- Deduct from wallet</span>
  <span class="sql-comment">-- Create payment record</span>
<span class="sql-keyword">COMMIT</span>;
          </div>
          <button class="btn btn-secondary" onclick="runSuccessTransaction()" id="btn-txn-success">
            ▶ Run Successful Transaction
          </button>
          <div id="txn-success-log" class="txn-log" style="margin-top:10px"></div>
          <div id="txn-success-result"></div>
        </div>

        <!-- Failure Panel -->
        <div class="txn-panel">
          <h4>❌ Scenario 2: Failed Transaction (ROLLBACK)</h4>
          <div style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:8px">
            Wallet: <strong>₹3,000</strong> &nbsp;|&nbsp; Plan: <strong>₹2,400</strong>
          </div>
          <div class="sql-block" style="font-size:0.78rem;padding:10px">
<span class="sql-keyword">BEGIN</span> TRANSACTION;
  <span class="sql-comment">-- Check wallet balance</span>
  <span class="sql-comment">-- Create subscription record</span>
  <span class="sql-comment">-- ✗ Payment processing fails</span>
<span class="sql-keyword">ROLLBACK</span>;
          </div>
          <button class="btn btn-danger" onclick="runFailureTransaction()" id="btn-txn-fail">
            ▶ Simulate Failure (ROLLBACK)
          </button>
          <div id="txn-fail-log" class="txn-log" style="margin-top:10px"></div>
          <div id="txn-fail-result"></div>
        </div>
      </div>

      <div class="sql-explanation" style="margin-top:16px">
        <strong>Viva Explanation:</strong>
        A <strong>TRANSACTION</strong> ensures database operations are atomic — meaning they 
        all succeed together or all fail together. <strong>BEGIN</strong> starts the transaction.
        <strong>COMMIT</strong> saves all changes permanently. <strong>ROLLBACK</strong> undoes 
        everything back to the state before BEGIN. In TiffinTrack, when a student subscribes, 
        we must create a subscription AND deduct the wallet AND create a payment record — all three 
        must succeed together. If any step fails (e.g. payment gateway error), ROLLBACK ensures 
        no subscription is created and the wallet is not deducted.
      </div>
    </div>
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

  addTxnLog(logDiv, '🔵', 'BEGIN TRANSACTION', 'info');
  await delay(500);
  addTxnLog(logDiv, '✓', 'Check wallet: ₹3,000 ≥ ₹2,400 → OK', 'done');
  await delay(500);
  addTxnLog(logDiv, '✓', 'Create subscription record → OK', 'done');
  await delay(500);
  addTxnLog(logDiv, '✓', 'Deduct ₹2,400 from wallet → OK', 'done');
  await delay(500);
  addTxnLog(logDiv, '✓', 'Create payment record → OK', 'done');
  await delay(400);
  addTxnLog(logDiv, '🟢', 'COMMIT — all changes saved', 'done');

  resultDiv.innerHTML = `
    <div class="txn-result commit">
      <div style="font-weight:700;color:var(--color-success)">✅ COMMIT Successful</div>
      <div style="font-size:0.85rem;margin-top:6px">
        Subscription: <strong>ACTIVE</strong><br>
        Wallet: <span class="txn-wallet">₹600</span>
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

  addTxnLog(logDiv, '🔵', 'BEGIN TRANSACTION', 'info');
  await delay(500);
  addTxnLog(logDiv, '✓', 'Check wallet: ₹3,000 ≥ ₹2,400 → OK', 'done');
  await delay(500);
  addTxnLog(logDiv, '✓', 'Create subscription record → OK', 'done');
  await delay(500);
  addTxnLog(logDiv, '✗', 'Payment gateway error — transaction failed!', 'failed');
  await delay(400);
  addTxnLog(logDiv, '🔴', 'ROLLBACK — all changes reversed', 'failed');

  resultDiv.innerHTML = `
    <div class="txn-result rollback">
      <div style="font-weight:700;color:var(--color-danger)">❌ ROLLBACK — No changes saved</div>
      <div style="font-size:0.85rem;margin-top:6px">
        Subscription: <strong>Not Created</strong><br>
        Wallet: <span class="txn-wallet" style="color:var(--color-text)">₹3,000</span> (restored)
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
    <span style="color:${colors[type] || 'var(--color-text)'}">${text}</span>
  `;
  container.appendChild(line);
}
