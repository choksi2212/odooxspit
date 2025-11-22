import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://stockmaster:password@localhost:5432/stockmaster',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-token-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-token-key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '60000', 10),
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
  },
  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@stockmaster.com',
    fromName: process.env.EMAIL_FROM_NAME || 'StockMaster',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

