import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ SQLite Database connected successfully via Prisma');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}
