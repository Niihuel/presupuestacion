// src/config/index.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  DB_USER: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_SERVER,
  DB_PORT: process.env.DB_PORT || 1433,
  DB_NAME: process.env.DB_DATABASE,
  DB_ENCRYPT: process.env.DB_ENCRYPT,
  DB_TRUST_SERVER_CERTIFICATE: process.env.DB_TRUST_SERVER_CERTIFICATE,
  DB_INSTANCE: process.env.DB_INSTANCE,
  JWT_SECRET: process.env.JWT_SECRET,
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || 15,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  LOGIN_ATTEMPTS_WINDOW: process.env.LOGIN_ATTEMPTS_WINDOW || 15,
  LOGIN_ATTEMPTS_MAX: process.env.LOGIN_ATTEMPTS_MAX || 5
};