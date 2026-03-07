const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/appConfig');

// Extrae token desde cabecera o cookie
function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

// Middleware: autenticación requerida
function authRequired(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token)
      return res.status(401).json({ error: 'No autenticado. Token ausente.' });

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      is_admin: !!payload.is_admin,
    };

    next();
  } catch (err) {
    console.error('Error de autenticación:', err.message);
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

// Middleware: acceso solo administradores
function adminOnly(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res
      .status(403)
      .json({ error: 'Acceso denegado: requiere rol de administrador.' });
  }
  next();
}

module.exports = { authRequired, adminOnly };
