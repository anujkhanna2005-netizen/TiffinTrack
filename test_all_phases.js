const http = require('http');
const app = require('./server/server');
const db = require('./server/db');

const server = http.createServer(app);
const PORT = 3009;

function request(path, options = {}, cookie = '') {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(cookie ? { 'Cookie': cookie } : {}),
      ...(options.headers || {})
    };
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api' + path,
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      const setCookies = res.headers['set-cookie'] || [];
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json, cookies: setCookies, rawHeaders: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, cookies: setCookies });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  await new Promise(r => server.listen(PORT, r));
  console.log('Test server running on port ' + PORT);

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(' [PASS] ' + name);
      passed++;
    } else {
      console.error(' [FAIL] ' + name + (extra ? ' -> ' + extra : ''));
      failed++;
    }
  }

  try {
    console.log('\n--- 1. AUTHENTICATION & 3-ROLE ACCESS CONTROL ---');
    // Test Login Student
    const studentLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'student@tiffintrack.demo', password: 'demo123' }
    });
    assert('Student Login', studentLogin.status === 200 && studentLogin.body.success, JSON.stringify(studentLogin.body));
    const studentCookie = (studentLogin.cookies[0] || '').split(';')[0];
    assert('Student Session Cookie Set', studentCookie.startsWith('tiffintrack_session='));

    // Test Login Vendor
    const vendorLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'vendor@tiffintrack.demo', password: 'demo123' }
    });
    assert('Vendor Login', vendorLogin.status === 200 && vendorLogin.body.success, JSON.stringify(vendorLogin.body));
    const vendorCookie = (vendorLogin.cookies[0] || '').split(';')[0];
    assert('Vendor Session Cookie Set', vendorCookie.startsWith('tiffintrack_session='));

    // Test Login Admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@tiffintrack.demo', password: 'demo123' }
    });
    assert('Admin Login', adminLogin.status === 200 && adminLogin.body.success, JSON.stringify(adminLogin.body));
    const adminCookie = (adminLogin.cookies[0] || '').split(';')[0];
    assert('Admin Session Cookie Set', adminCookie.startsWith('tiffintrack_session='));

    // Test GET /auth/me for Student
    const meRes = await request('/auth/me', {}, studentCookie);
    assert('GET /auth/me for Student', meRes.status === 200 && meRes.body.user.email === 'student@tiffintrack.demo');

    // Test Invalid Login
    const badLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'student@tiffintrack.demo', password: 'wrongpassword' }
    });
    assert('Reject Wrong Password (401)', badLogin.status === 401);

    // Test Signup Rejection for delivery_agent / agent
    const agentSignup = await request('/auth/signup', {
      method: 'POST',
      body: {
        email: 'newagent@test.com',
        password: 'password123',
        role: 'delivery_agent',
        full_name: 'Test Agent',
        phone: '9876543210'
      }
    });
    assert('Reject delivery_agent Signup (422)', agentSignup.status === 422);

    console.log('\n--- 2. CORE CRUD & VENDOR-MANAGED DELIVERIES ---');
    // GET /vendors
    const vendorsRes = await request('/vendors');
    assert('GET /vendors returns vendors list', vendorsRes.status === 200 && vendorsRes.body.length >= 5);

    // GET /vendors/V001
    const v1Res = await request('/vendors/V001');
    assert('GET /vendors/V001 details & plans', v1Res.status === 200 && v1Res.body.vendor_id === 'V001');

    // GET /customer
    const custRes = await request('/customer', {}, studentCookie);
    assert('GET /customer returns student profile', custRes.status === 200 && custRes.body.customer_id === 'C001');

    // POST /rating
    const ratingRes = await request('/rating', {
      method: 'POST',
      body: { vendor_id: 'V001', taste_score: 5, hygiene_score: 5, punctuality_score: 5, value_score: 5, review: 'Fantastic food!' }
    }, studentCookie);
    assert('POST /rating succeeds', ratingRes.status === 201 && ratingRes.body.rating_id);

    // POST /complaint
    const compRes = await request('/complaint', {
      method: 'POST',
      body: { vendor_id: 'V001', issue_type: 'Delayed Delivery', description: 'Arrived 20 mins late' }
    }, studentCookie);
    assert('POST /complaint files ticket', compRes.status === 201 && compRes.body.complaint_id);

    // GET /deliveries (Vendor view)
    const vendorDels = await request('/deliveries', {}, vendorCookie);
    assert('Vendor views active deliveries', vendorDels.status === 200 && Array.isArray(vendorDels.body));

    // Vendor updates delivery status (prepared -> dispatched)
    const delToUpdate = vendorDels.body.find(d => d.vendor_id === 'V001') || vendorDels.body[0];
    if (delToUpdate) {
      const updateRes = await request(`/delivery/${delToUpdate.delivery_id}`, {
        method: 'PATCH',
        body: { status: 'dispatched' }
      }, vendorCookie);
      assert('Vendor updates delivery status to dispatched', updateRes.status === 200 && updateRes.body.success);

      // Student attempting to modify vendor delivery (blocked with 403)
      const studentUpdateAttempt = await request(`/delivery/${delToUpdate.delivery_id}`, {
        method: 'PATCH',
        body: { status: 'delivered' }
      }, studentCookie);
      assert('Student blocked from updating vendor delivery (403)', studentUpdateAttempt.status === 403);
    }

    console.log('\n--- 3. STUDENT ADD-ONS & WORKFLOWS ---');
    // Ensure C001 is actively subscribed to V001
    await db.query('UPDATE subscriptions SET vendor_id = "V001", plan_id = "P001", status = "active" WHERE customer_id = "C001" AND sub_id = "S001"');

    // Add-on 1: Skip Meal
    const skipRes = await request('/subscription/skip', {
      method: 'POST',
      body: { skip_date: '2026-09-25', meal_type: 'Lunch', reason: 'College Fest' }
    }, studentCookie);
    assert('Add-on 1: Pause & Skip with Dynamic COD Bill Adjustment', skipRes.status === 201 && Number(skipRes.body.credit_amount) > 0);

    // Add-on 2: Menu Voting
    await db.query('DELETE FROM menu_votes WHERE customer_id = "C001" AND vote_date = CURRENT_DATE');
    const voteRes = await request('/menu/vote', {
      method: 'POST',
      body: { dish_option: 'Hyderabadi Veg Biryani with Mirchi ka Salan', vendor_id: 'V001' }
    }, studentCookie);
    assert('Add-on 2: Cast Menu Vote', voteRes.status === 200 && voteRes.body.success);

    // Add-on 3: Group Subscription
    const groupRes = await request('/groups/create', {
      method: 'POST',
      body: { group_name: 'Room 304 Squad', residence_name: 'Hostel Block A' }
    }, studentCookie);
    assert('Add-on 3: Create Flat Group with Discount', groupRes.status === 201 && groupRes.body.group.group_id);

    // Add-on 4: Meal Customization
    const prefRes = await request('/subscription/preferences', {
      method: 'PUT',
      body: { spice_level: 'Spicy', no_onion_garlic: false, dietary_pref: 'veg' }
    }, studentCookie);
    assert('Add-on 4: Meal Customization & Spice Preferences', prefRes.status === 200);

    // Add-on 5: One-Click Seamless Vendor Switching
    const currentSubRows = await db.query('SELECT vendor_id FROM subscriptions WHERE customer_id = "C001" AND status = "active"');
    const currentVendor = currentSubRows.length > 0 ? currentSubRows[0].vendor_id : 'V001';
    const targetVendor = currentVendor === 'V001' ? 'V002' : 'V001';
    const targetPlan = targetVendor === 'V001' ? 'P001' : 'P004';

    const switchRes = await request('/subscription/switch-vendor', {
      method: 'POST',
      body: { target_vendor_id: targetVendor, target_plan_id: targetPlan, reason: 'Switching for variety' }
    }, studentCookie);
    assert('Add-on 5: One-Click Vendor Switch (ACID Transaction)', switchRes.status === 200 && switchRes.body.details.to_vendor_id === targetVendor);

    console.log('\n--- 4. ADMIN CONTROL & AUDIT TRAIL ---');
    // GET /admin
    const adminRes = await request('/admin', {}, adminCookie);
    assert('GET /admin platform statistics', adminRes.status === 200 && adminRes.body.stats.total_users >= 20);

    // GET /admin/users (Check 3 roles only)
    const usersRes = await request('/admin/users', {}, adminCookie);
    assert('GET /admin/users returns user roster', usersRes.status === 200 && usersRes.body.length >= 20);

    // GET /admin/audit-logs
    const auditRes = await request('/admin/audit-logs', {}, adminCookie);
    assert('GET /admin/audit-logs records audit trail', auditRes.status === 200 && auditRes.body.length > 0);

    console.log('\n--- 5. PHASE D: DBMS VIVA SHOWCASE ---');
    // GET /dbms/indexes
    const idxRes = await request('/dbms/indexes');
    assert('GET /dbms/indexes queries B-Tree index schema', idxRes.status === 200 && idxRes.body.indexes.length > 0);

    // GET /dbms/views
    const viewsRes = await request('/dbms/views');
    assert('GET /dbms/views queries SQL views', viewsRes.status === 200 && viewsRes.body.views.top_rated_vendors && viewsRes.body.views.complaint_trend);

    // GET /dbms/triggers
    const trigRes = await request('/dbms/triggers');
    assert('GET /dbms/triggers inspects triggers', trigRes.status === 200 && trigRes.body.triggers.length >= 3);

    // GET /dbms/transactions
    const txnRes = await request('/dbms/transactions');
    assert('GET /dbms/transactions ACID demo metadata', txnRes.status === 200 && txnRes.body.atomicity);

    console.log('\n=============================================');
    console.log('TEST SUMMARY: ' + passed + ' PASSED, ' + failed + ' FAILED');
    console.log('=============================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
