/**
 * 404 Not Found Middleware
 * Catches any request for routes that are not defined.
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Centralized Error Handling Middleware
 * Formats errors into structured JSON responses.
 */
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
