const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/appConfig');

function validateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Token faltante.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, ... }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
}

module.exports = validateToken;
