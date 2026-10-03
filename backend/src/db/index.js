/**
 * Champions Club - Database Module Entry Point
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const { pool, query, withTransaction, testConnection } = require('../config/database');

module.exports = {
  pool,
  query,
  withTransaction,
  testConnection
};
