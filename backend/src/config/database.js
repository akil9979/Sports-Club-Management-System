/**
 * Champions Club - PostgreSQL Database Pool & Query Interface
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool(config.db);

pool.on('error', (err) => console.error('[DB Error]', err.message));

const query = (text, params) => pool.query(text, params);

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function testConnection() {
  const res = await pool.query('SELECT NOW() AS current_time, current_database() AS db_name');
  return res.rows[0];
}

module.exports = {
  pool,
  query,
  withTransaction,
  testConnection
};
