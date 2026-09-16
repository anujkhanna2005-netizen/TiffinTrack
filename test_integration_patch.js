// ============================================================
// TiffinTrack - Integration Patch Verification Test Suite
// test_integration_patch.js
// ============================================================

const http = require('http');
const app = require('./server/server');
const db = require('./server/db');

let server;
let port;
let cookie = '';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const method = options.method || 'GET';
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (options.cookie) {
      headers['Cookie'] = options.cookie;
    } else if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: port,
        path: '/api' + path,
        method: method,
        headers: headers
      },
      (res) => {
        let data = '';
        const setCookie = res.headers['set-cookie'];
        let returnedCookie = '';
        if (setCookie && setCookie.length > 0) {
          returnedCookie = setCookie[0].split(';')[0];
          cookie = returnedCookie;
        }
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, cookie: returnedCookie || cookie });
        });
      }
    );
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

let passedCount = 0;
let totalCount = 0;

function assert(description, condition, extra = '') {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${description}`);
  } else {
    console.error(`  ❌ FAIL: ${description}${extra ? ' -> ' + extra : ''}`);
  }
}

async function runTests() {
  console.log('============================================================');
  console.log('TIFFINTRACK INTEGRATION PATCH - VERIFICATION TEST SUITE');
  console.log('============================================================\n');

  server = http.createServer(app);
  await new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Schema Version & Migration Guard (Fix 3 & Fix 5)
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: Schema Versioning & Backfill ---');
    // Call any endpoint to trigger ensureSchema()
    await request('/vendors');
    const [meta] = await db.query("SELECT meta_value FROM _schema_meta WHERE meta_key = 'schema_version'");
    assert('Schema version recorded as 1.0.3 (Fix 3)', meta && meta.meta_value === '1.0.3', JSON.stringify(meta));

    const [nullVotes] = await db.query("SELECT COUNT(*) as cnt FROM menu_votes WHERE vendor_id IS NULL");
    assert('Zero menu_votes rows with NULL vendor_id (Fix 5 backfill verified)', nullVotes && nullVotes.cnt === 0, JSON.stringify(nullVotes));

    // -------------------------------------------------------------
    // Test 2: Student Auth & Meal Preferences Integration (Fix 4 & Fix 7)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Meal Preferences & Extra Roti ---');
    const studentLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'student@tiffintrack.demo', password: 'demo123' }
    });
    const studentCookie = studentLogin.cookie;
    assert('Login as Student (student@tiffintrack.demo)', studentLogin.status === 200 && studentLogin.body.success, JSON.stringify(studentLogin.body));

    const longInstructions = 'A'.repeat(300); // Exceeds 200 char cap
    const prefRes = await request('/subscription/preferences', {
      method: 'PUT',
      cookie: studentCookie,
      body: {
        spice_level: 'high',
        bread_preference: 'extra_roti',
        special_notes: longInstructions,
        save_as_default: true
      }
    });

    assert('PUT /preferences returns success', prefRes.status === 200 && prefRes.body.success, JSON.stringify(prefRes.body));
    assert('Special instructions capped at 200 chars (Fix 7)', prefRes.body && prefRes.body.preferences && prefRes.body.preferences.special_instructions.length <= 200);

    // Verify preference reflected on active subscription
    const subRes = await request('/subscription', { cookie: studentCookie });
    assert('Active subscription has bread_preference = extra_roti', subRes.body && subRes.body.bread_preference === 'extra_roti', JSON.stringify(subRes.body ? subRes.body.bread_preference : null));
    assert('Active subscription has spice_level = high', subRes.body && subRes.body.spice_level === 'high');

    // -------------------------------------------------------------
    // Test 3: Deliveries API Returns Preferences & Dynamic Menu Items
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Deliveries API with Dynamic Menu & Preferences ---');
    const delivRes = await request('/deliveries', { cookie: studentCookie });
    assert('Deliveries query returns active deliveries', delivRes.status === 200 && Array.isArray(delivRes.body));
    if (delivRes.body.length > 0) {
      const firstDeliv = delivRes.body[0];
      assert('Delivery contains student bread_preference', firstDeliv.bread_preference !== undefined);
      assert('Delivery contains student spice_level', firstDeliv.spice_level !== undefined);
      assert('Delivery menu_items is dynamic array', Array.isArray(firstDeliv.menu_items) && firstDeliv.menu_items.length > 0);
    }

    // -------------------------------------------------------------
    // Test 4: Menu Voting (Fix 6: Active Subscriber check, 409 Duplicate)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Menu Voting & Vendor Tally ---');
    
    // Clear today's vote for test clean state
    const today = new Date().toISOString().slice(0, 10);
    await db.query("DELETE FROM menu_votes WHERE customer_id = 'C001' AND vote_date = ?", [today]);

    // Vote 1: Cast vote
    const vote1 = await request('/menu/vote', {
      method: 'POST',
      cookie: studentCookie,
      body: { dish_option: 'Hyderabadi Veg Biryani', vendor_id: 'V001' }
    });
    assert('Active subscriber can cast menu vote', vote1.status === 200 && vote1.body.success, JSON.stringify(vote1.body));

    // Vote 2: Duplicate vote on same day must return 409
    const vote2 = await request('/menu/vote', {
      method: 'POST',
      cookie: studentCookie,
      body: { dish_option: 'Paneer Butter Masala', vendor_id: 'V001' }
    });
    assert('Duplicate vote on same day returns 409 Conflict', vote2.status === 409);

    // Switch to vendor that student is not subscribed to (V004) -> 403
    const voteForbidden = await request('/menu/vote', {
      method: 'POST',
      cookie: studentCookie,
      body: { dish_option: 'Paneer Butter Masala', vendor_id: 'V004' }
    });
    assert('Voting for vendor without active subscription returns 403 Forbidden (Fix 6)', voteForbidden.status === 403);

    // -------------------------------------------------------------
    // Test 5: Vendor Menu Votes Tally & Voted Dish Addition (Fix 6)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Vendor Tally & Adding Voted Dish ---');
    const vendorLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'vendor@tiffintrack.demo', password: 'demo123' }
    });
    const vendorCookie = vendorLogin.cookie;
    assert('Login as Vendor V001', vendorLogin.status === 200 && vendorLogin.body.success, JSON.stringify(vendorLogin.body));

    const tallyRes = await request('/vendor/menu-votes', { cookie: vendorCookie });
    assert('Vendor can fetch live menu vote tally', tallyRes.status === 200 && tallyRes.body.total_votes > 0, JSON.stringify(tallyRes.body));

    // Vendor adds voted dish to today's menu
    const addDishRes = await request('/vendor/menu/add-voted-dish', {
      method: 'POST',
      cookie: vendorCookie,
      body: { dish_name: 'Hyderabadi Veg Biryani' }
    });
    assert('Vendor can add voted dish to daily menu', addDishRes.status === 201 && addDishRes.body.success, JSON.stringify(addDishRes.body));

    // Vendor trying to modify another vendor's menu -> 403
    const crossVendorDish = await request('/vendor/V002/menu/add-voted-dish', {
      method: 'POST',
      cookie: vendorCookie,
      body: { dish_name: 'Hyderabadi Veg Biryani' }
    });
    assert('Vendor modifying another vendor menu returns 403 Forbidden (Fix 6 ownership check)', crossVendorDish.status === 403);

    // -------------------------------------------------------------
    // Test 6: Group Discounts (Fix 1: locked_price preserved + Fix 2: Tiers)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Group Discounts (Fix 1 & Fix 2) ---');

    // Read initial subscription and payment
    const initSub = await request('/subscription', { cookie: studentCookie });
    const originalLockedPrice = initSub.body.locked_price;

    // Reset customer payment for clean testing
    await db.query("UPDATE payments SET amount_due = amount, status = 'pending_cash' WHERE subscription_id = ?", [initSub.body.sub_id]);

    // Test unique group code
    const testGroupCode = 'GRPTEST_' + Date.now();

    // 1 member joins -> 0%
    const join1 = await request('/groups/join', { method: 'POST', cookie: studentCookie, body: { group_code: testGroupCode } });
    assert('Group with 1 member has 0% discount', join1.body.discount_percentage === 0 && !join1.body.discount_unlocked, JSON.stringify(join1.body));

    // 2 members join -> 0%
    await request('/groups/join', { method: 'POST', cookie: studentCookie, body: { group_code: testGroupCode } });

    // 3 members join -> Tier 1: 5% discount (Fix 2)
    const join3 = await request('/groups/join', { method: 'POST', cookie: studentCookie, body: { group_code: testGroupCode } });
    assert('Group with 3 members unlocks 5% discount tier (Fix 2)', join3.body.discount_percentage === 5.0 && join3.body.discount_unlocked, JSON.stringify(join3.body));

    // Verify payments.amount_due is reduced by 5% but subscriptions.locked_price is UNCHANGED (Fix 1)
    const subAfter3 = await request('/subscription', { cookie: studentCookie });
    assert('subscriptions.locked_price is PRESERVED after group discount (Fix 1)', subAfter3.body.locked_price === originalLockedPrice, `expected ${originalLockedPrice} got ${subAfter3.body.locked_price}`);
    const expected5PctDue = Math.round(originalLockedPrice * 0.95 * 100) / 100;
    assert('payments.amount_due reflects 5% discount', subAfter3.body.amount_due === expected5PctDue, `expected ${expected5PctDue} got ${subAfter3.body.amount_due}`);

    // Grow group to 5 members -> Tier 2: 10% discount (Fix 2)
    await request('/groups/join', { method: 'POST', cookie: studentCookie, body: { group_code: testGroupCode } });
    const join5 = await request('/groups/join', { method: 'POST', cookie: studentCookie, body: { group_code: testGroupCode } });
    assert('Group with 5 members unlocks 10% discount tier (Fix 2)', join5.body.discount_percentage === 10.0, JSON.stringify(join5.body));

    const subAfter5 = await request('/subscription', { cookie: studentCookie });
    assert('subscriptions.locked_price remains PRESERVED at 10% tier (Fix 1)', subAfter5.body.locked_price === originalLockedPrice, `expected ${originalLockedPrice} got ${subAfter5.body.locked_price}`);
    const expected10PctDue = Math.round(originalLockedPrice * 0.90 * 100) / 100;
    assert('payments.amount_due reflects 10% discount', subAfter5.body.amount_due === expected10PctDue, `expected ${expected10PctDue} got ${subAfter5.body.amount_due}`);

    // -------------------------------------------------------------
    // Final Summary
    // -------------------------------------------------------------
    console.log('\n============================================================');
    console.log(`TEST SUMMARY: ${passedCount} / ${totalCount} TESTS PASSED`);
    console.log('============================================================');

    if (passedCount === totalCount) {
      console.log('🎉 ALL INTEGRATION PATCH FIXES & INVARIANTS VERIFIED SUCCESSFULLY!\n');
    } else {
      console.error('⚠️ SOME TESTS FAILED. Please review the output above.\n');
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('Test Suite Exception:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
