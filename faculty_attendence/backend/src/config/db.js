import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { env } from './env.js';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  prisma = global.__prisma;
}

prisma.$connect()
  .then(() => {
    logger.info('Database connection established successfully via Prisma.');
  })
  .catch((err) => {
    logger.error(`Prisma connection error: ${err.message}`);
  });

export { prisma };
export default prisma;
