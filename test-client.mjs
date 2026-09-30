import { createTRPCClient } from '@trpc/client';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import superjson from 'superjson';

const client = createTRPCClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      transformer: superjson,
    }),
  ],
});

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
  console.log('Success error:', e.message, e);
}

// Test error case
try {
  await client.mutation('auth.register', {
    email: 'client-test-' + (Date.now() - 1000) + '@test.com',
    nickname: 'test',
    password: 'Abcdefgh1!',
  });
} catch (e) {
  console.log('Error result:', e.message);
  console.log('Error shape:', JSON.stringify(e.shape));
}
