/**
 * Champions Club - Environment & Configuration Manager
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = (process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/sports_club_db')
  .replace(/&?channel_binding=[^&]+/g, '');

const useSsl = connectionString.includes('neon.tech') ||
  connectionString.includes('sslmode=require') ||
  process.env.DB_SSL === 'true';

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'champions_club_super_secure_jwt_secret_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false
  }
};
