let hits = new Map();

module.exports = (windowMs, max) => (req, res, next) => {
  const now = Date.now();
  const key = req.ip;
  const arr = (hits.get(key) || []).filter(t => now - t < windowMs);

  arr.push(now);
  hits.set(key, arr);

  if (arr.length > max) return res.status(429).json({ error: "Demasiadas solicitudes" });
  next();
};
