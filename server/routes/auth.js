const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const router = Router();

const ADMIN = {
  username: 'admin',
  password: '123456',
  role: 'dispatcher',
  name: 'Dispatcher',
};

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (username !== ADMIN.username || password !== ADMIN.password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password',
    });
  }

  const user = {
    username: ADMIN.username,
    role: ADMIN.role,
    name: ADMIN.name,
  };

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '12h' });
  return res.json({ success: true, token, user });
});

module.exports = router;
