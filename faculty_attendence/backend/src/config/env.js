import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : ['*'],
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://erp_admin:erp_secret_pass@localhost:5432/ssgmce_erp?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'ssgmce_super_secure_jwt_access_secret_key_2026_x94j2!',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'ssgmce_super_secure_jwt_refresh_secret_key_2026_q83m7!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
