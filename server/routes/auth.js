const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');
const { db, presentUser } = require('../data/store');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, try again later' },
});

// Compared against when the username is unknown so response time does not reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  const user = db.users.find((item) => item.username === username.trim());
  const valid = bcrypt.compareSync(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !valid || user.disabled) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password',
    });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: config.jwtExpiresIn,
  });
  return res.json({ success: true, token, user: presentUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ success: true, user: presentUser(req.user) });
});

module.exports = router;
