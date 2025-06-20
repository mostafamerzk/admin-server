/**
 * Global Error Handler Middleware
 * Handles all errors in the application and sends appropriate responses
 */

export const globalHandler = (error, req, res, next) => {
  // Default error status and message
  let statusCode = error.cause || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate entry';
    } else if (error.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  }

  // Log error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
