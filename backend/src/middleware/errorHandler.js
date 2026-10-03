/**
 * Champions Club - Centralized API Error Handling Middleware
 * Role: MEMBER 3 (Canonical Database Owner)
 */

function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Handle specific PostgreSQL error codes
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'A duplicate record with unique properties already exists.',
          detail: isDev ? err.detail : undefined
        });

      case '23503': // Foreign key violation
      case '23001': // Restrict violation
        return res.status(400).json({
          success: false,
          error: 'Foreign Key Violation',
          message: 'Referenced entity does not exist or cannot be deleted due to existing dependent records.',
          detail: isDev ? err.detail : undefined
        });

      case '23P01': // Exclusion violation (e.g. overlapping booking)
        return res.status(409).json({
          success: false,
          error: 'Slot Conflict',
          message: 'The requested court slot is already booked and conflicts with an existing booking.'
        });

      case '23514': // Check constraint violation
        return res.status(400).json({
          success: false,
          error: 'Constraint Violation',
          message: 'Input violates database integrity rules.',
          detail: isDev ? err.detail : undefined
        });

      default:
        break;
    }
  }

  // Handle Validation errors
  if (err.name === 'ValidationError') {
    return res.status(err.statusCode || 422).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      errors: err.errors || []
    });
  }

  // Handle standard HTTP errors
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  console.error('[API Error]', {
    path: req.originalUrl,
    method: req.method,
    statusCode,
    message: err.message,
    stack: isDev ? err.stack : undefined
  });

  res.status(statusCode).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(isDev && { stack: err.stack })
  });
}

module.exports = errorHandler;
