try {
  const r = await fetch('http://localhost:3000/login');
  console.log('Server OK:', r.status);
} catch(e) {
  console.log('Server not running:', e.message);
}
