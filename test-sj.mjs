import superjson from 'superjson';
const result = superjson.serialize({ email: 'test@test.com', nickname: 'test', password: 'Abcdefgh1!' });
console.log('Serialized:', JSON.stringify(result, null, 2));
const deserialized = superjson.deserialize(result);
console.log('Deserialized:', JSON.stringify(deserialized));
