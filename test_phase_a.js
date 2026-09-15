const http = require('http');

async function testSuite() {
  console.log('=== RUNNING PHASE A COMPREHENSIVE VERIFICATION SUITE ===');

  const BASE = 'http://localhost:3000/api';
  let studentCookie = '';
  let vendorCookie = '';
  let adminCookie = '';

  // Helper request
  function request(method, path, body = null, cookie = '') {
    return new Promise((resolve, reject) => {
      const url = new URL(BASE + path);
      const req = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(cookie ? { 'Cookie': cookie } : {})
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let parsed = {};
          try { parsed = JSON.parse(data); } catch(e) { parsed = data; }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  // 1. Wrong Password (Expected 401)
  const r1 = await request('POST', '/auth/login', { email: 'student@tiffintrack.demo', password: 'wrongpassword' });
  console.log('[TEST 1] Login with invalid password -> Status:', r1.status, '(Expected 401)');
  if (r1.status !== 401) throw new Error('Test 1 Failed');

  // 2. Student Login (Expected 200 + Cookie)
  const r2 = await request('POST', '/auth/login', { email: 'student@tiffintrack.demo', password: 'demo123' });
  console.log('[TEST 2] Student Login -> Status:', r2.status, 'User:', r2.body.user.email);
  if (r2.status !== 200 || !r2.headers['set-cookie']) throw new Error('Test 2 Failed');
  studentCookie = r2.headers['set-cookie'][0].split(';')[0];

  // 3. GET /api/auth/me for student (Expected 200)
  const r3 = await request('GET', '/auth/me', null, studentCookie);
  console.log('[TEST 3] GET /auth/me for Student -> Role:', r3.body.user.role, 'Profile ID:', r3.body.user.profile.customer_id);
  if (r3.status !== 200 || r3.body.user.role !== 'customer') throw new Error('Test 3 Failed');

  // 4. Student accessing Admin endpoint (Expected 403 Forbidden)
  const r4 = await request('GET', '/admin', null, studentCookie);
  console.log('[TEST 4] Student accessing /api/admin -> Status:', r4.status, '(Expected 403)');
  if (r4.status !== 403) throw new Error('Test 4 Failed');

  // 5. Admin Login (Expected 200)
  const r5 = await request('POST', '/auth/login', { email: 'admin@tiffintrack.demo', password: 'demo123' });
  console.log('[TEST 5] Admin Login -> Status:', r5.status);
  adminCookie = r5.headers['set-cookie'][0].split(';')[0];

  // 6. Admin accessing /api/admin (Expected 200 with platform stats)
  const r6 = await request('GET', '/admin', null, adminCookie);
  console.log('[TEST 6] Admin Dashboard Data -> Total Users:', r6.body.total_users, 'Active Subs:', r6.body.active_subscriptions);
  if (r6.status !== 200 || r6.body.total_users < 1) throw new Error('Test 6 Failed');

  // 7. Duplicate subscription attempt (Expected 409 Conflict)
  const r7 = await request('POST', '/subscription', { plan_id: 'P001', vendor_id: 'V001' }, studentCookie);
  console.log('[TEST 7] Student Duplicate Subscription -> Status:', r7.status, 'Msg:', r7.body.error);
  if (r7.status !== 409) throw new Error('Test 7 Failed');

  // 8. Public Admin Signup Attempt (Expected 403)
  const r8 = await request('POST', '/auth/signup', { email: 'hacker@admin.com', password: '123', role: 'admin', name: 'Hacker' });
  console.log('[TEST 8] Public Admin Signup -> Status:', r8.status, '(Expected 403)');
  if (r8.status !== 403) throw new Error('Test 8 Failed');

  // 9. Check Audit Log count in Admin (Expected > 0)
  const r9 = await request('GET', '/audit', null, adminCookie);
  console.log('[TEST 9] Audit Logs -> Total Entries:', r9.body.length, 'Latest Action:', r9.body[0].action);
  if (r9.status !== 200 || r9.body.length === 0) throw new Error('Test 9 Failed');

  // 10. Student Logout (Expected 200)
  const r10 = await request('POST', '/auth/logout', {}, studentCookie);
  console.log('[TEST 10] Student Logout -> Status:', r10.status);
  const r10check = await request('GET', '/auth/me', null, studentCookie);
  console.log('[TEST 10b] Auth Check after Logout -> Status:', r10check.status, '(Expected 401)');
  if (r10check.status !== 401) throw new Error('Test 10 Failed');

  console.log('=== ALL 10 PHASE A VERIFICATION TESTS PASSED PERFECTLY ===');
}

testSuite().catch(err => {
  console.error('TEST RUNNER FAILED:', err);
  process.exit(1);
});
