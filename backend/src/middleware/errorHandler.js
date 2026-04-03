export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details;

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  } else if (status >= 500) {
    console.error(message);
  }

  res.status(status).json({
    error: message,
    ...(details ? { details } : {}),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' });
}
