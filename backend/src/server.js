/**
 * Champions Club - Server Bootstrap
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const app = require('./app');
const config = require('./config/env');
const { testConnection } = require('./config/database');

async function startServer() {
  try {
    console.log('[Server] Testing PostgreSQL database connection...');
    const dbInfo = await testConnection();
    console.log(`[Server] Connected to PostgreSQL successfully on database: ${dbInfo.db_name}`);

    const server = app.listen(config.port, () => {
      console.log(`[Server] Champions Club Backend running on port ${config.port} (${config.env})`);
      console.log(`[Server] Health check: http://localhost:${config.port}/api/health`);
    });

    const shutdown = () => {
      console.log('[Server] Graceful shutdown initiated...');
      server.close(() => {
        console.log('[Server] Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[Server] Fatal error during startup:', err);
    process.exit(1);
  }
}

startServer();
