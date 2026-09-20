// config/env.js
require('dotenv').config();

const requiredVars = [
  'DATABASE_URL',
  'TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  databasePath: process.env.DATABASE_URL,
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET,
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
};