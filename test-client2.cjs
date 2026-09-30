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
  // Test error case with existing email
  try {
    await client.mutation('auth.register', {
      email: 'client-test-1790345935175@test.com',
      nickname: 'test',
      password: 'Abcdefgh1!',
    });
  } catch (e) {
    console.log('Error message:', e.message);
    console.log('Error shape:', JSON.stringify(e.shape));
    console.log('Error code:', e.code);
    console.log('Error name:', e.name);
  }
}

main().catch(console.error);
