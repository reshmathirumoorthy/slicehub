import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized environment access.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/slicehub',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_only_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: process.env.JWT_COOKIE_NAME || 'slicehub_token',
    adminCookieName:
      process.env.JWT_ADMIN_COOKIE_NAME || 'slicehub_admin_token',
    cookieMaxAgeMs:
      Number(process.env.JWT_COOKIE_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'SliceHub <noreply@slicehub.com>',
    /** When unset: true for port 465, false otherwise (STARTTLS on 587). */
    secure:
      process.env.EMAIL_SECURE === undefined
        ? undefined
        : String(process.env.EMAIL_SECURE).toLowerCase() === 'true',
  },
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 5,
  cart: {
    deliveryFee: Number(process.env.CART_DELIVERY_FEE) || 49,
    freeDeliveryMin: Number(process.env.CART_FREE_DELIVERY_MIN) || 999,
    taxRate: Number(process.env.CART_TAX_RATE) || 0.05,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  /** Unpaid online orders expire after this many minutes */
  paymentExpiryMinutes: Number(process.env.PAYMENT_EXPIRY_MINUTES) || 30,
  inventory: {
    alertCooldownHours: Number(process.env.INVENTORY_ALERT_COOLDOWN_HOURS) || 12,
    cronSchedule: process.env.INVENTORY_CRON || '0 * * * *',
    alertEmail: process.env.ADMIN_ALERT_EMAIL || '',
  },
};

const WEAK_JWT_SECRETS = new Set([
  '',
  'dev_only_secret',
  'secret',
  'jwt_secret',
  'changeme',
]);

if (env.nodeEnv === 'production') {
  if (!process.env.JWT_SECRET || WEAK_JWT_SECRETS.has(String(process.env.JWT_SECRET))) {
    throw new Error(
      'FATAL: JWT_SECRET must be set to a strong unique value in production',
    );
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('FATAL: MONGODB_URI must be set in production');
  }
}

export default env;
