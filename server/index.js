const express = require('express');
const cors = require('cors');
const { requireAuth } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const workersRouter = require('./routes/workers');
const scheduleRouter = require('./routes/schedule');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/orders', requireAuth, ordersRouter);
app.use('/api/workers', requireAuth, workersRouter);
app.use('/api/schedule', requireAuth, scheduleRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dispatch API listening on http://0.0.0.0:${PORT}`);
});
