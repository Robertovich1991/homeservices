const { Router } = require('express');
const { isIsoDate, parseSlot } = require('../data/schedule');
const { badRequest } = require('../lib/validate');
const { db } = require('../data/store');

const router = Router();

const STATUSES = ['new', 'assigned', 'completed', 'cancelled'];

function slotHours(slot) {
  const parsed = parseSlot(slot);
  return parsed ? (parsed[1] - parsed[0]) / 60 : 0;
}

router.get('/', (req, res) => {
  const date = String(req.query.date || '');
  if (!isIsoDate(date)) {
    return badRequest(res, 'Invalid date');
  }

  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  const byCategory = Object.fromEntries(db.categories.map((category) => [category.id, 0]));
  for (const order of db.orders) {
    byStatus[order.status] = (byStatus[order.status] || 0) + 1;
    byCategory[order.category] = (byCategory[order.category] || 0) + 1;
  }

  const onDay = db.orders.filter((order) => order.date === date);
  const workers = db.workers.map((worker) => {
    const jobs = onDay.filter(
      (order) =>
        order.workerId === worker.id &&
        (order.status === 'assigned' || order.status === 'completed'),
    );
    return {
      id: worker.id,
      name: worker.name,
      category: worker.category,
      jobs: jobs.length,
      hours: jobs.reduce((total, order) => total + slotHours(order.timeSlot), 0),
    };
  });

  return res.json({
    date,
    totals: {
      orders: db.orders.length,
      workers: db.workers.length,
      users: db.users.length,
      categories: db.categories.length,
    },
    byStatus,
    byCategory,
    day: {
      orders: onDay.length,
      unassigned: onDay.filter((order) => order.status === 'new').length,
      assigned: onDay.filter((order) => order.status === 'assigned').length,
    },
    workers,
  });
});

module.exports = router;
