const r = await fetch('http://localhost:3000/api/trpc/auth.register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ '0': { json: { email: 'test1790345495072@test.com', nickname: 'test', password: 'Abcdefgh1!' }, meta: { values: [] } } })
});
console.log('Status:', r.status);
const d = await r.json();
console.log('Response:', JSON.stringify(d, null, 2));
