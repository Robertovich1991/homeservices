const { Router } = require('express');
const { requireRole } = require('../middleware/auth');
const { findConflict } = require('../data/schedule');
const { PHONE, rules, pick, badRequest, notFound, conflict } = require('../lib/validate');
const { db, newId, save, legacyCategoryId } = require('../data/store');

const router = Router();
const adminOnly = requireRole('admin');

const workerSchema = {
  name: { rule: rules.text(100), required: true },
  phone: { rule: rules.pattern(PHONE), required: true },
  category: { rule: rules.text(40), required: true },
};

function hasActiveOrders(workerId) {
  return db.orders.some((order) => order.workerId === workerId && order.status === 'assigned');
}

function findWorker(req, res) {
  const worker = db.workers.find((item) => item.id === req.params.id);
  if (!worker) {
    notFound(res, 'Worker not found');
  }
  return worker;
}

router.get('/', (req, res) => {
  const { date, timeSlot, excludeOrderId } = req.query;
  const category = req.query.category ? legacyCategoryId(req.query.category) : null;
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

router.post('/', adminOnly, (req, res) => {
  const { data, error } = pick(req.body, workerSchema);
  if (error) {
    return badRequest(res, error);
  }
  data.category = legacyCategoryId(data.category);
  if (!db.categories.some((category) => category.id === data.category)) {
    return badRequest(res, 'Category not found');
  }
  const worker = { id: newId('wrk'), ...data };
  db.workers.push(worker);
  save();
  return res.status(201).json(worker);
});

router.patch('/:id', adminOnly, (req, res) => {
  const worker = findWorker(req, res);
  if (!worker) {
    return undefined;
  }
  const { data, error } = pick(req.body, workerSchema, { partial: true });
  if (error) {
    return badRequest(res, error);
  }
  if (data.category) {
    data.category = legacyCategoryId(data.category);
    if (!db.categories.some((category) => category.id === data.category)) {
      return badRequest(res, 'Category not found');
    }
    if (data.category !== worker.category && hasActiveOrders(worker.id)) {
      return conflict(res, 'Worker has assigned orders in the current trade');
    }
  }
  Object.assign(worker, data);
  if (data.name) {
    for (const order of db.orders) {
      if (order.workerId === worker.id) {
        order.assignedTo = worker.name;
      }
    }
  }
  save();
  return res.json(worker);
});

router.delete('/:id', adminOnly, (req, res) => {
  const worker = findWorker(req, res);
  if (!worker) {
    return undefined;
  }
  if (hasActiveOrders(worker.id)) {
    return conflict(res, 'Worker has assigned orders');
  }
  db.workers.splice(db.workers.indexOf(worker), 1);
  save();
  return res.json({ success: true });
});

module.exports = router;
