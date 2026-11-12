const { Router } = require('express');
const { findConflict } = require('../data/schedule');
const { db } = require('../data/store');

const router = Router();

router.get('/', (req, res) => {
  const { category, date, timeSlot, excludeOrderId } = req.query;
  const list = category
    ? db.workers.filter((worker) => worker.category === category)
    : db.workers;

  const result = list.map((worker) => {
    const busy = Boolean(
      date &&
        timeSlot &&
        findConflict(db.orders, {
          workerId: worker.id,
          date,
          timeSlot,
          excludeOrderId,
        }),
    );
    return { ...worker, busy };
  });

  return res.json(result);
});

module.exports = router;
