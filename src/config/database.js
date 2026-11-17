/**
 * Database Configuration
 * Prisma Client Setup
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error']
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log('📤 Database disconnected');
};

const closeDB = async () => {
  await prisma.$disconnect();
  console.log('📤 Database disconnected');
};

module.exports = { prisma, connectDB, disconnectDB };
