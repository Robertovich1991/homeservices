const { Router } = require('express');
const { findConflict, isIsoDate, parseSlot } = require('../data/schedule');
const { db, presentOrder, save } = require('../data/store');

const router = Router();

function matchesQuery(order, query) {
  const { category, status, date, q } = query;
  if (category && order.category !== category) {
    return false;
  }
  if (status && order.status !== status) {
    return false;
  }
  if (date && order.date !== date) {
    return false;
  }
  if (q) {
    const haystack = [
      order.title,
      order.clientName,
      order.address,
      order.description,
      order.assignedTo,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(String(q).trim().toLowerCase())) {
      return false;
    }
  }
  return true;
}

router.get('/', (req, res) => {
  const list = db.orders.filter((order) => matchesQuery(order, req.query));
  return res.json(list.map(presentOrder));
});

router.get('/:id', (req, res) => {
  const order = db.orders.find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  return res.json(presentOrder(order));
});

router.post('/:id/assign', (req, res) => {
  const order = db.orders.find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const { workerId, date, timeSlot } = req.body || {};
  if (!workerId || !date || !timeSlot) {
    return res.status(400).json({
      success: false,
      message: 'workerId, date, and timeSlot are required',
    });
  }

  if (!isIsoDate(String(date))) {
    return res.status(400).json({ success: false, message: 'Invalid date' });
  }
  if (!parseSlot(timeSlot)) {
    return res.status(400).json({ success: false, message: 'Invalid time slot' });
  }

  const worker = db.workers.find((item) => item.id === workerId);
  if (!worker) {
    return res.status(400).json({ success: false, message: 'Worker not found' });
  }
  if (worker.category !== order.category) {
    return res.status(400).json({
      success: false,
      message: 'Worker does not cover this trade',
    });
  }

  const conflict = findConflict(db.orders, {
    workerId: worker.id,
    date: String(date),
    timeSlot: String(timeSlot),
    excludeOrderId: order.id,
  });
  if (conflict) {
    return res.status(409).json({
      success: false,
      message: 'That worker is already booked for an overlapping time slot',
    });
  }

  order.status = 'assigned';
  order.workerId = worker.id;
  order.assignedTo = worker.name;
  order.date = String(date);
  order.timeSlot = String(timeSlot);
  save();

  return res.json(presentOrder(order));
});

router.post('/:id/status', (req, res) => {
  const order = db.orders.find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const status = req.body && req.body.status;
  if (status !== 'completed' && status !== 'cancelled') {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  if (status === 'completed' && order.status !== 'assigned') {
    return res.status(400).json({
      success: false,
      message: 'Only an assigned order can be completed',
    });
  }
  if (status === 'cancelled' && order.status !== 'new' && order.status !== 'assigned') {
    return res.status(400).json({
      success: false,
      message: 'This order can no longer be cancelled',
    });
  }

  order.status = status;
  save();
  return res.json(presentOrder(order));
});

module.exports = router;
