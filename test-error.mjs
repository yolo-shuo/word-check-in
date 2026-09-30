const r = await fetch('http://localhost:3000/api/trpc/auth.register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ '0': { json: { email: 'success' + Date.now() + '@test.com', nickname: 'test', password: 'Abcdefgh1!' }, meta: {} } })
});
console.log('Error Status:', r.status);
const d = await r.json();
console.log('Error Response:', JSON.stringify(d, null, 2));
