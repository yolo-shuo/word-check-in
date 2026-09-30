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

async function main() {
  console.log('=== Testing Registration Flow ===');
  
  // Test 1: Successful registration
  console.log('1. Testing successful registration...');
  try {
    const email = 'flow-test-' + Date.now() + '@test.com';
    const result = await client.mutation('auth.register', {
      email,
      nickname: 'flow-test',
      password: 'Abcdefgh1!',
    });
    console.log('   Registration successful:', JSON.stringify(result, null, 4));
  } catch (e) {
    console.log('   Registration failed:', e.message);
    console.log('   Error shape:', JSON.stringify(e.shape));
  }
  
  // Test 2: Duplicate registration (should fail)
  console.log('2. Testing duplicate registration (should fail)...');
  try {
    await client.mutation('auth.register', {
      email: 'flow-test-' + (Date.now() - 1000) + '@test.com',
      nickname: 'flow-test',
      password: 'Abcdefgh1!',
    });
    console.log('   Should have failed!');
  } catch (e) {
    console.log('   Correctly failed with error:');
    console.log('   Error message:', e.message);
    console.log('   Error shape:', JSON.stringify(e.shape));
    console.log('   Error code:', e.code);
  }
  
  // Test 3: Auth.me (unauthenticated)
  console.log('3. Testing auth.me (unauthenticated)...');
  try {
    const result = await client.query('auth.me');
    console.log('   Result:', JSON.stringify(result, null, 4));
  } catch (e) {
    console.log('   Error:', e.message);
    console.log('   Error shape:', JSON.stringify(e.shape));
  }
}

main().catch(console.error);
