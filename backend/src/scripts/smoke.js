const API = process.env.API_URL || 'http://localhost:5000';

async function login(email, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function get(path, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { headers });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function run() {
  const users = [
    { name: 'admin', email: 'admin@example.com', password: 'adminadmin' },
    { name: 'analyst', email: 'analyst@example.com', password: 'analyst12' },
    { name: 'viewer', email: 'viewer@example.com', password: 'viewer1234' },
  ];

  const results = {};

  for (const u of users) {
    console.log(`\nLogging in as ${u.name}...`);
    const r = await login(u.email, u.password);
    console.log('  login status', r.status);
    const token = r.body?.token;
    results[u.name] = { login: r };

    console.log('  calling GET /api/dashboard/summary');
    const dash = await get('/api/dashboard/summary', token);
    console.log('    status', dash.status, 'body:', dash.body && (Object.keys(dash.body).length ? 'OK' : JSON.stringify(dash.body)));
    results[u.name].dashboard = dash;

    console.log('  calling GET /api/transactions');
    const tx = await get('/api/transactions', token);
    console.log('    status', tx.status, 'body:', tx.body && (tx.body.data ? `items=${tx.body.data.length}` : JSON.stringify(tx.body)));
    results[u.name].transactions = tx;
    
    if (u.name === 'admin' && token) {
      console.log('  calling GET /api/users (admin only)');
      const usersList = await get('/api/users', token);
      console.log('    status', usersList.status, 'body:', usersList.body && (usersList.body.users ? `users=${usersList.body.users.length}` : JSON.stringify(usersList.body)));
      results[u.name].users = usersList;
    }

    }

    console.log('\nSummary:');
    console.log(JSON.stringify(results, null, 2));
}

run().catch((e) => {
  console.error('Smoke test failed:', e);
  process.exit(1);
});
