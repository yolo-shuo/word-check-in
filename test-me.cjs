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
  console.log('Testing auth.me (unauthenticated)...');
  try {
    const result = await client.query('auth.me');
    console.log('Result:', JSON.stringify(result));
  } catch (e) {
    console.log('Error:', e.message);
    console.log('Shape:', JSON.stringify(e.shape));
    console.log('Code:', e.code);
  }
}

main().catch(console.error);
