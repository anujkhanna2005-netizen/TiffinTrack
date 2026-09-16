// ============================================================
// TiffinTrack - Comprehensive COD Model Automated Test Suite
// tests/test_cod_workflow.js
// ============================================================

const http = require('http');
const db = require('../server/db');

const BASE_URL = 'http://localhost:3000';
let server;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function makeRequest(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      const setCookie = res.headers['set-cookie'];
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, body: json, headers: res.headers, cookie: setCookie ? setCookie[0] : null });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(email, password) {
  const res = await makeRequest('POST', '/api/auth/login', { email, password });
  return res.cookie;
}

async function runTests() {
  console.log('============================================================');
  console.log('TIFFINTRACK — COD & DIRECT REQUEST AUTOMATED TEST SUITE');
  console.log('============================================================\n');

  // Start express server
  const app = require('../server/server');
  server = app.listen(3000);
  await new Promise(r => setTimeout(r, 600));

  try {
    // 1. Authenticate users
    console.log('[Phase 1] Authenticating Role Sessions...');
    const studentCookie = await login('student@tiffintrack.demo', 'demo123');
    const vendorCookie = await login('vendor@tiffintrack.demo', 'demo123');
    const adminCookie = await login('admin@tiffintrack.demo', 'demo123');

    assert(studentCookie, 'Student logged in successfully');
    assert(vendorCookie, 'Vendor logged in successfully');
    assert(adminCookie, 'Admin logged in successfully');

    // Clean any active/pending subscriptions for test customer C001
    await db.query('UPDATE subscriptions SET status = "cancelled" WHERE customer_id = "C001" AND status IN ("active", "pending")');

    // 2. Test Subscription Request (Pending status & COD payment record)
    console.log('\n[Phase 2] Testing Student Direct Subscription Request (COD)...');
    const subRes = await makeRequest('POST', '/api/subscription', { plan_id: 'P001', vendor_id: 'V001' }, studentCookie);
    assert(subRes.status === 201, 'Requesting subscription returns HTTP 201 Created');
    assert(subRes.body.subscription && subRes.body.subscription.status === 'pending', 'Subscription created with status="pending" (not active)');
    assert(subRes.body.subscription.mode === 'cash_on_delivery', 'Subscription mode is "cash_on_delivery"');
    assert(subRes.body.subscription.locked_price === 2800, 'Locked price recorded as ₹2800');

    const subId = subRes.body.subscription.sub_id;

    // Verify Payment table record created with pending_cash
    const payRows = await db.query('SELECT * FROM payments WHERE subscription_id = ?', [subId]);
    assert(payRows.length > 0, 'Payment record exists for new subscription request');
    assert(payRows[0].status === 'pending_cash', 'Payment status is "pending_cash"');
    assert(payRows[0].mode === 'cash_on_delivery', 'Payment mode is "cash_on_delivery" (never "wallet")');
    assert(parseFloat(payRows[0].amount_due) === 2800, 'Payment amount_due is ₹2800');

    // 3. Test Duplicate Request Guard (409 Conflict)
    console.log('\n[Phase 3] Testing Duplicate Request Guard...');
    const dupRes = await makeRequest('POST', '/api/subscription', { plan_id: 'P002', vendor_id: 'V001' }, studentCookie);
    assert(dupRes.status === 409, 'Duplicate request while one is pending returns HTTP 409 Conflict');

    // 4. Test Student Cancel-Pending Request & Resubmission
    console.log('\n[Phase 4] Testing Student Cancel-Pending Request...');
    const cancelReqRes = await makeRequest('PATCH', `/api/subscription/${subId}/cancel-request`, null, studentCookie);
    assert(cancelReqRes.status === 200, 'Student can cancel their own pending request');

    // Re-check duplicate guard allows new request after cancellation
    const reSubRes = await makeRequest('POST', '/api/subscription', { plan_id: 'P001', vendor_id: 'V001' }, studentCookie);
    assert(reSubRes.status === 201, 'Student can submit new request after previous is cancelled');
    const activeSubId = reSubRes.body.subscription.sub_id;

    // 5. Test Vendor Ownership Check on Approval (403 for another vendor)
    console.log('\n[Phase 5] Testing Vendor Approval & Ownership Checks...');
    const v2User = await db.query('SELECT * FROM users WHERE email = "royal@tiffintrack.demo"');
    let v2Cookie = null;
    if (v2User.length > 0) {
      v2Cookie = await login('royal@tiffintrack.demo', 'demo123');
    }

    if (v2Cookie) {
      const wrongVendRes = await makeRequest('PATCH', `/api/vendor/subscription/${activeSubId}/approve`, null, v2Cookie);
      assert(wrongVendRes.status === 403, 'Vendor cannot approve another vendor subscription (HTTP 403)');
    }

    // 6. Test Approval Race Condition (Atomic conditional update)
    console.log('\n[Phase 6] Testing Approval Race Condition Resolution...');
    const [call1, call2] = await Promise.all([
      makeRequest('PATCH', `/api/vendor/subscription/${activeSubId}/approve`, null, vendorCookie),
      makeRequest('PATCH', `/api/admin/subscription/${activeSubId}/approve`, null, adminCookie)
    ]);

    const statuses = [call1.status, call2.status].sort();
    assert(statuses[0] === 200 && statuses[1] === 409, 'Race Condition Handled: Exactly one approval succeeds (200) and the other gets 409 Conflict');

    // 7. Test Plan Price Editing & Price Lock Guarantees (Fix 8)
    console.log('\n[Phase 7] Testing Vendor Plan Price Edit & Locked Price Continuity...');
    const editPlanRes = await makeRequest('PATCH', '/api/vendor/meal-plan/P001', { price: 3200 }, vendorCookie);
    assert(editPlanRes.status === 200, 'Vendor can edit their meal plan price (₹2800 -> ₹3200)');

    // Verify existing subscription locked_price is unchanged
    const subCheck = await db.query('SELECT locked_price, status FROM subscriptions WHERE sub_id = ?', [activeSubId]);
    assert(parseFloat(subCheck[0].locked_price) === 2800, 'Active subscriber locked_price remains unchanged at ₹2800 despite vendor plan price hike');

    // 8. Test Dynamic Skip Calculation (Fix 1: per_meal_cost from locked price)
    console.log('\n[Phase 8] Testing Dynamic Meal Skip Calculation...');
    const futureDate = '2026-10-15';
    const skipRes = await makeRequest('POST', '/api/subscription/skip', { skip_date: futureDate, reason: 'Out of town' }, studentCookie);
    assert(skipRes.status === 201, 'Meal skip approved with 201 Created');
    assert(skipRes.body.per_meal_cost === 93.33, 'Per meal cost dynamically calculated from locked price (₹2800 / 30 = ₹93.33)');
    assert(skipRes.body.new_amount_due === 2706.67, 'Amount due reduced to ₹2706.67');

    // 9. Test Vendor Mark Payment Collected (Fix 2)
    console.log('\n[Phase 9] Testing Vendor Mark Payment Collected...');
    const payRow = await db.query('SELECT payment_id FROM payments WHERE subscription_id = ?', [activeSubId]);
    const payId = payRow[0].payment_id;

    const collectRes = await makeRequest('PATCH', `/api/vendor/payment/${payId}/collect`, null, vendorCookie);
    assert(collectRes.status === 200, 'Vendor can mark COD payment collected');
    const updatedPay = await db.query('SELECT status, collected_at FROM payments WHERE payment_id = ?', [payId]);
    assert(updatedPay[0].status === 'collected' && updatedPay[0].collected_at !== null, 'Payment status transitioned to "collected" with timestamp');

    // Restore plan price for demo data
    await db.query('UPDATE meal_plans SET price = 2800 WHERE plan_id = "P001"');

    console.log('\n============================================================');
    console.log(`TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('============================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test suite uncaught error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
}

runTests();
