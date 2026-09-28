import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDB, prisma } from './config/db.js';

const PORT = env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`====================================================`);
    logger.info(` SSGMCE Faculty Attendance API Server Running       `);
    logger.info(` Environment: ${env.NODE_ENV}                       `);
    logger.info(` Port:        ${PORT}                               `);
    logger.info(` Base URL:    http://localhost:${PORT}/api/v1       `);
    logger.info(` Health:      http://localhost:${PORT}/health       `);
    logger.info(`====================================================`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        logger.info('Database disconnected.');
      } catch (err) {
        logger.error('Error during database disconnect:', err.message);
      } finally {
        process.exit(0);
      }
    });

    setTimeout(() => {
      logger.error('Forceful shutdown timeout expired');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error('Server startup failed:', err);
  process.exit(1);
});
