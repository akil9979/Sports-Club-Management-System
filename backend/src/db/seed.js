/**
 * Champions Club - Database Seed Runner
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config/env');

async function seedDatabase(existingPool = null) {
  const targetPool = existingPool || require('../config/database').pool;
  const seedPath = path.resolve(__dirname, '../../schema/seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  console.log(`[DB Seed] Seeding canonical database from ${seedPath}...`);

  const client = await targetPool.connect();
  try {
    await client.query(sql);
    console.log('[DB Seed] Canonical seed data inserted successfully!');
  } catch (err) {
    console.error('[DB Seed] Failed to seed database:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[DB Seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Seed] Fatal error during seeding:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
