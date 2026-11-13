const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { requireAuth, requireRole } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const workersRouter = require('./routes/workers');
const scheduleRouter = require('./routes/schedule');
const usersRouter = require('./routes/users');
const categoriesRouter = require('./routes/categories');
const statsRouter = require('./routes/stats');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  cors({
    // Native mobile clients send no Origin header, so only browser origins are checked.
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  }),
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/orders', requireAuth, ordersRouter);
app.use('/api/workers', requireAuth, workersRouter);
app.use('/api/schedule', requireAuth, scheduleRouter);
app.use('/api/categories', requireAuth, categoriesRouter);
app.use('/api/users', requireAuth, requireRole('admin'), usersRouter);
app.use('/api/stats', requireAuth, requireRole('admin'), statsRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

if (config.serveWeb && fs.existsSync(config.webDist)) {
  app.use(express.static(config.webDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(config.webDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large' });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
