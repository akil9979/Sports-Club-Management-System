/**
 * Champions Club - Database Initialization Script
 * Role: MEMBER 3 (Canonical Database Owner)
 * 
 * Safely creates database (if not exists) and applies schema.sql
 */

const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');
const config = require('../config/env');

async function ensureDatabaseExists() {
  if (config.db.connectionString) {
    // Cloud managed databases (Neon, AWS RDS, Supabase) have pre-provisioned databases
    return;
  }

  const adminClient = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: 'postgres' // Connect to default postgres DB first
  });

  try {
    await adminClient.connect();
    const checkDb = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.db.database]
    );

    if (checkDb.rowCount === 0) {
      console.log(`[DB Init] Database "${config.db.database}" does not exist. Creating...`);
      // Escape identifier safely
      const escapedDbName = `"${config.db.database.replace(/"/g, '""')}"`;
      await adminClient.query(`CREATE DATABASE ${escapedDbName}`);
      console.log(`[DB Init] Database "${config.db.database}" created successfully.`);
    } else {
      console.log(`[DB Init] Database "${config.db.database}" already exists.`);
    }
  } catch (err) {
    console.error('[DB Init] Error checking/creating database:', err.message);
    throw err;
  } finally {
    await adminClient.end();
  }
}

async function initSchema(existingPool = null) {
  await ensureDatabaseExists();

  const targetPool = existingPool || require('../config/database').pool;
  const schemaPath = path.resolve(__dirname, '../../schema/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log(`[DB Init] Applying canonical schema from ${schemaPath}...`);

  const client = await targetPool.connect();
  try {
    await client.query(sql);
    console.log('[DB Init] Canonical schema applied successfully!');
  } catch (err) {
    console.error('[DB Init] Failed to apply schema:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initSchema()
    .then(() => {
      console.log('[DB Init] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Init] Fatal error during initialization:', err);
      process.exit(1);
    });
}

module.exports = { initSchema, ensureDatabaseExists };
