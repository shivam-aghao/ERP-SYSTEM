import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

let isDbConnected = false;
let connectionProbePromise = null;

// Initialize Prisma client with clean logging to eliminate console spam
const realPrisma = new PrismaClient({
  log: [],
});

/**
 * Rapid connectivity probe with 1.2s timeout.
 * Prevents 5+ second connection hangs across API routes when remote Supabase pooler is unreachable.
 */
function probeConnection() {
  if (!connectionProbePromise) {
    connectionProbePromise = (async () => {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('DB_TIMEOUT')), 1200)
        );
        await Promise.race([realPrisma.$queryRaw`SELECT 1`, timeout]);
        isDbConnected = true;
        console.log('✅ [Database] Supabase PostgreSQL connected successfully.');
      } catch (_) {
        isDbConnected = false;
        console.log('⚡ [Database] Supabase pooler offline. Fast in-memory SSGMCE engine active (0ms latency).');
      }
      return isDbConnected;
    })();
  }
  return connectionProbePromise;
}

// Kick off probe immediately in background
probeConnection();

const modelHandler = {
  get(target, method) {
    return async function (...args) {
      await probeConnection();
      if (!isDbConnected) {
        throw new Error('DATABASE_OFFLINE');
      }
      return realPrisma[target.modelName][method](...args);
    };
  },
};

export const prisma = new Proxy(realPrisma, {
  get(target, prop) {
    if (prop === '$connect' || prop === '$disconnect') {
      return async () => Promise.resolve();
    }
    if (prop === '$queryRaw') {
      return async (...args) => {
        await probeConnection();
        if (!isDbConnected) throw new Error('DATABASE_OFFLINE');
        return realPrisma.$queryRaw(...args);
      };
    }
    if (typeof prop === 'string' && prop.startsWith('$')) {
      return realPrisma[prop]?.bind(realPrisma);
    }
    return new Proxy({ modelName: prop }, modelHandler);
  },
});

export default prisma;
