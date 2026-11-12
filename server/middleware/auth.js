const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dispatch-dev-secret';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

module.exports = { JWT_SECRET, requireAuth };
