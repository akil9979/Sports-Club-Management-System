/**
 * Champions Club - Express Application Factory
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { testConnection, query } = require('./config/database');

// Module routes
const authRoutes = require('./modules/auth/authRoutes');
const memberRoutes = require('./modules/members/memberRoutes');
const membershipRoutes = require('./modules/memberships/membershipRoutes');
const bookingRoutes = require('./modules/bookings/bookingRoutes');
const bookingController = require('./modules/bookings/bookingController');
const shopRoutes = require('./modules/shop/shopRoutes');
const barRoutes = require('./modules/bar/barRoutes');

const app = express();

// Global Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.status(200).json({
      status: 'healthy',
      service: 'champions-club-backend',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        time: dbStatus.current_time,
        databaseName: dbStatus.db_name
      }
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      service: 'champions-club-backend',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: err.message
      }
    });
  }
});

// Direct public endpoints matching frontend contract
app.get('/api/sports', bookingController.getSports);
app.get('/api/courts', bookingController.getCourts);

// Module API Routing
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/membership-plans', membershipRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bar', barRoutes);
app.use('/api', shopRoutes);

// Catch-all 404 for unhandled API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint '${req.originalUrl}' does not exist`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
