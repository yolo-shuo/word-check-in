const r = await fetch('http://localhost:3000/api/trpc/auth.register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ '0': { json: { email: 'success' + Date.now() + '@test.com', nickname: 'test' + Date.now(), password: 'Abcdefgh1!' }, meta: {} } })
});
console.log('Success Status:', r.status);
const d = await r.json();
console.log('Success Response:', JSON.stringify(d, null, 2));
