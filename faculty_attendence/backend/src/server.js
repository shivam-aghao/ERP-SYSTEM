import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/db.js';
import redisClient from './config/redis.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`====================================================`);
  logger.info(` SSGMCE ERP Attendance Backend Server Running`);
  logger.info(` Environment: ${env.NODE_ENV}`);
  logger.info(` Port:        ${PORT}`);
  logger.info(` Health:      http://localhost:${PORT}/health`);
  logger.info(` API Base:    http://localhost:${PORT}/api/v1`);
  logger.info(`====================================================`);
});

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected.');
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.quit();
        logger.info('Redis disconnected.');
      }
    } catch (err) {
      logger.error(`Error during graceful shutdown: ${err.message}`);
    } finally {
      process.exit(0);
    }
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
