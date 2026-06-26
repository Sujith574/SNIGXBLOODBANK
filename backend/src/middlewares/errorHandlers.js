function notFoundHandler(req, res) {
  return res.status(404).json({ success: false, message: 'Route not found', data: null, statusCode: 404 });
}

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    data: null,
    statusCode,
  });
}

module.exports = { notFoundHandler, errorHandler };

