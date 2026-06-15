const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

const config = {
  // Environment
  env: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isTest: process.env.NODE_ENV === "test",

  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || "v1",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Database (PostgreSQL via Prisma - configured via DATABASE_URL env var)
  database: {
    // DATABASE_URL is read directly by Prisma from environment
    url: process.env.DATABASE_URL || "postgresql://localhost/siwes_management",
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "fallback_secret_change_in_production",
    expire: process.env.JWT_EXPIRE || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret",
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || "30d",
  },

  // Password
  password: {
    default: process.env.DEFAULT_PASSWORD || "Change@123",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  },

  // Email
  email: {
    provider: (process.env.EMAIL_PROVIDER || "smtp").toLowerCase(),
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.sendgrid.net",
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10),
    secure:
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === "true"
        : parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10) ===
          465,
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    password: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
    from:
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      "SIWES Management <noreply@siwes.edu>",
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || process.env.EMAIL_FROM,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    from: process.env.SENDGRID_FROM || process.env.EMAIL_FROM,
  },
  brevo: {
    apiKey: process.env.BREVO_KEY,
    from: process.env.BREVO_FROM || process.env.EMAIL_FROM,
  },

  // CORS
  cors: {
    origins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
      : ["http://localhost:3000", "http://localhost:5173"],
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    path: process.env.UPLOAD_PATH || "./uploads",
    allowedTypes: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || "logs/app.log",
  },

  // Pagination
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
  },

  redis: {
    enabled: Boolean(process.env.REDIS_URL),
    url: process.env.REDIS_URL || "",
  },

  queue: {
    emailConcurrency: parseInt(process.env.QUEUE_EMAIL_CONCURRENCY, 10) || 5,
    failureAlertThreshold:
      parseInt(process.env.QUEUE_FAILURE_ALERT_THRESHOLD, 10) || 10,
    failureAlertWindowMs:
      parseInt(process.env.QUEUE_FAILURE_ALERT_WINDOW_MS, 10) || 60_000,
    dashboardPath:
      process.env.QUEUE_DASHBOARD_PATH || `/api/${process.env.API_VERSION || "v1"}/queues/dashboard`,
  },

  cache: {
    dashboardTtl: parseInt(process.env.CACHE_TTL_DASHBOARD, 10) || 60,
    reportsTtl: parseInt(process.env.CACHE_TTL_REPORTS, 10) || 120,
  },
};

const validateConfig = () => {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = [];

  required.forEach((key) => {
    if (!process.env[key] && config.env !== "test") {
      missing.push(key);
    }
  });

  if (missing.length > 0 && config.env === "production") {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (config.env === "production" && config.jwt.secret.includes("fallback")) {
    console.warn(
      "WARNING: Using fallback JWT secret in production! Please set JWT_SECRET.",
    );
  }
};

// Validate configuration on module load
if (config.env !== "test") {
  validateConfig();
}

module.exports = config;
