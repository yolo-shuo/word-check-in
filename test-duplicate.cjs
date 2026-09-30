const { createTRPCClient } = require('@trpc/client');
const { httpBatchLink } = require('@trpc/client/links/httpBatchLink');
const superjson = require('superjson');

const client = createTRPCClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      transformer: superjson,
    }),
  ],
});

async function main() {
  const email = 'duplicate-test-' + Date.now() + '@test.com';
  
  console.log('1. First registration...');
  const result1 = await client.mutation('auth.register', {
    email,
    nickname: 'test1',
    password: 'Abcdefgh1!',
  });
  console.log('   Result:', JSON.stringify(result1));
  
  console.log('2. Second registration (same email)...');
  try {
    const result2 = await client.mutation('auth.register', {
      email,
      nickname: 'test2',
      password: 'Abcdefgh1!',
    });
    console.log('   ERROR: Should have failed! Result:', JSON.stringify(result2));
  } catch (e) {
    console.log('   Correctly failed:');
    console.log('   Message:', e.message);
    console.log('   Shape:', JSON.stringify(e.shape));
    console.log('   Code:', e.code);
  }
}

main().catch(console.error);
