const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../data/store');

const JWT_SECRET = config.jwtSecret;

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  const user = db.users.find((item) => item.id === payload.sub);
  if (!user || user.disabled) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  req.user = user;
  return next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return next();
  };
}

module.exports = { JWT_SECRET, requireAuth, requireRole };
