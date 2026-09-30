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
  // Test success case
  try {
    const email = 'client-test-' + Date.now() + '@test.com';
    const result = await client.mutation('auth.register', {
      email,
      nickname: 'test' + Date.now(),
      password: 'Abcdefgh1!',
    });
    console.log('Success result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.log('Success error:', e.message);
  }

  // Test error case
  try {
    await client.mutation('auth.register', {
      email: 'client-test-0@test.com',
      nickname: 'test',
      password: 'Abcdefgh1!',
    });
  } catch (e) {
    console.log('Error message:', e.message);
    console.log('Error shape:', JSON.stringify(e.shape));
    console.log('Error code:', e.code);
  }
}

main().catch(console.error);
