const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function list(value, fallback) {
  if (!value) {
    return fallback;
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function required(name) {
  const value = process.env[name];
  if (isProduction && !value) {
    throw new Error(`${name} must be set when NODE_ENV=production`);
  }
  return value || null;
}

const config = {
  isProduction,
  isTest,
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT) || 5000,
  jwtSecret: required('JWT_SECRET') || 'dispatch-dev-secret',
  jwtExpiresIn: '12h',
  corsOrigins: list(process.env.CORS_ORIGINS, isProduction ? [] : ['http://localhost:5173']),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: required('ADMIN_PASSWORD'),
  storeFile: process.env.STORE_FILE || path.join(__dirname, 'data', 'store.json'),
  serveWeb: process.env.SERVE_WEB === '1',
  webDist: path.join(__dirname, '..', 'web', 'dist'),
};

module.exports = config;
