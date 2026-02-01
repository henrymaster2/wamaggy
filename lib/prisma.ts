import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// This ensures that the PrismaClient isn't recreated every time 
// your code reloads during development.
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // This helps you see the SQL in your terminal
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;