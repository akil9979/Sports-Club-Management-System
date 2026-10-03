/**
 * Champions Club - Database Seed Runner
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function seedDatabase(existingPool = pool) {
  const seedPath = path.resolve(__dirname, '../../schema/seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  console.log(`[DB Seed] Seeding database from ${seedPath}...`);
  await existingPool.query(sql);
  console.log('[DB Seed] Seed data inserted successfully.');
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[DB Seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Seed] Failed:', err.message);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
