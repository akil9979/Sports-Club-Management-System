/**
 * Champions Club - Database Initialization Script
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function initSchema(existingPool = pool) {
  const schemaPath = path.resolve(__dirname, '../../schema/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log(`[DB Init] Applying schema from ${schemaPath}...`);
  await existingPool.query(sql);
  console.log('[DB Init] Schema applied successfully.');
}

if (require.main === module) {
  initSchema()
    .then(() => {
      console.log('[DB Init] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Init] Failed:', err.message);
      process.exit(1);
    });
}

module.exports = { initSchema };
