import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';

/**
 * Prisma Client Singleton
 * Ensures a single instance of PrismaClient throughout the application
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.server.env === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (config.server.env !== 'production') globalThis.prismaGlobal = prisma;

// Graceful shutdown handler
export async function disconnectDB() {
  await prisma.$disconnect();
}

