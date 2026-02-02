export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err, req, res) {
  console.error(`${req.method} ${req.originalUrl}: ${err.message}`);
  // console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Something went wrong...' });
}
