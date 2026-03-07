const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/appConfig');

function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        req.user = null;
    }
    next();
}

module.exports = optionalAuth;
