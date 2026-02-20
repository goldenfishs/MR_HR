import dotenv from 'dotenv';
import { randomBytes } from 'crypto';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  dbPath: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  };
  sms: {
    accessKeyId: string;
    accessKeySecret: string;
    signName: string;
    templateCode: string;
  };
  frontendUrl: string;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const hasAccessSecret = Boolean(process.env.JWT_ACCESS_SECRET);
const hasRefreshSecret = Boolean(process.env.JWT_REFRESH_SECRET);

if ((!hasAccessSecret || !hasRefreshSecret) && isProduction) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production');
}

if (!hasAccessSecret || !hasRefreshSecret) {
  console.warn('JWT secrets are not fully configured. Using ephemeral development secrets.');
}

const developmentAccessSecret = randomBytes(32).toString('hex');
const developmentRefreshSecret = randomBytes(32).toString('hex');

const config: Config = {
  nodeEnv,
  port: parseInt(process.env.PORT || '3001', 10),
  dbPath: process.env.DB_PATH || './database/interview.db',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || developmentAccessSecret,
    refreshSecret: process.env.JWT_REFRESH_SECRET || developmentRefreshSecret,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Interview System <noreply@interview.com>',
  },
  sms: {
    accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
    signName: process.env.SMS_SIGN_NAME || '面试系统',
    templateCode: process.env.SMS_TEMPLATE_CODE || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export default config;
