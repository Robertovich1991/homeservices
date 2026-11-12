const { Router } = require('express');
const { isIsoDate, parseSlot } = require('../data/schedule');
const { db, presentOrder } = require('../data/store');

const router = Router();

function slotStart(slot) {
  const parsed = parseSlot(slot);
  return parsed ? parsed[0] : 24 * 60;
}

router.get('/', (req, res) => {
  const date = String(req.query.date || '');
  if (!isIsoDate(date)) {
    return res.status(400).json({ success: false, message: 'Invalid date' });
  }

  const onDay = db.orders.filter((order) => order.date === date);
  const unassigned = onDay
    .filter((order) => order.status === 'new')
    .sort((a, b) => slotStart(a.timeSlot) - slotStart(b.timeSlot))
    .map(presentOrder);

  const workers = db.workers.map((worker) => {
    const jobs = onDay
      .filter(
        (order) =>
          order.workerId === worker.id &&
          (order.status === 'assigned' || order.status === 'completed'),
      )
      .sort((a, b) => slotStart(a.timeSlot) - slotStart(b.timeSlot))
      .map(presentOrder);
    const free = !jobs.some((job) => job.status === 'assigned');
    return { ...worker, free, jobs };
  });

  return res.json({ date, unassigned, workers });
});

module.exports = router;
