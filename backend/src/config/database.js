/**
 * Champions Club - PostgreSQL Database Pool & Query Interface
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('[Database Pool] Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Execute parameterized query
 * @param {string} text - Parameterized SQL query
 * @param {Array} params - Query arguments
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('[SQL]', { text, params, duration, rows: res.rowCount });
  }
  return res;
}

/**
 * Execute callback within a database transaction
 * Automatically performs BEGIN, COMMIT, or ROLLBACK
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>}
 */
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

/**
 * Check connection status
 */
async function testConnection() {
  const res = await query('SELECT NOW() AS current_time, current_database() AS db_name');
  return res.rows[0];
}

module.exports = {
  pool,
  query,
  withTransaction,
  testConnection
};
