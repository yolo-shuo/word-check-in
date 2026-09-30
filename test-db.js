
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect().then(() => {
  console.log('Connected');
  return prisma.$disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
