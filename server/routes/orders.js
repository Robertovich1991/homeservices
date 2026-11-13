const { Router } = require('express');
const { requireRole } = require('../middleware/auth');
const { checkAssignment } = require('../lib/assignment');
const { PHONE, rules, pick, badRequest, notFound } = require('../lib/validate');
const { isIsoDate, parseSlot } = require('../data/schedule');
const { db, newId, presentOrder, save, legacyCategoryId } = require('../data/store');

const router = Router();
const adminOnly = requireRole('admin');

const STATUSES = ['new', 'assigned', 'completed', 'cancelled'];

const orderSchema = {
  title: { rule: rules.text(120), required: true },
  category: { rule: rules.text(40), required: true },
  address: { rule: rules.text(200), required: true },
  clientName: { rule: rules.text(100), required: true },
  clientPhone: { rule: rules.pattern(PHONE), required: true },
  date: { rule: rules.isoDate(), required: true },
  timeSlot: { rule: rules.timeSlot(), required: true },
  description: { rule: rules.optionalText(2000) },
  workerId: { rule: rules.nullableId() },
  status: { rule: rules.oneOf(STATUSES) },
};

function matchesQuery(order, query) {
  const { category, status, date, q } = query;
  if (category && order.category !== legacyCategoryId(category)) {
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

function findOrder(req, res) {
  const order = db.orders.find((item) => item.id === req.params.id);
  if (!order) {
    notFound(res, 'Order not found');
  }
  return order;
}

/**
 * Merges `changes` into `current`, keeps status and worker consistent and
 * runs the same worker checks as /assign. Returns `{ order }` or `{ status, message }`.
 */
function resolveOrder(current, changes) {
  const next = { ...current, ...changes };

  if (!db.categories.some((category) => category.id === next.category)) {
    return { status: 400, message: 'Category not found' };
  }

  if ('workerId' in changes && changes.workerId === null && next.status === 'assigned') {
    next.status = 'new';
  }
  if (next.workerId && next.status === 'new') {
    next.status = 'assigned';
  }
  if (next.status === 'assigned' && !next.workerId) {
    return { status: 400, message: 'An assigned order needs a worker' };
  }

  const scheduleChanged = ['workerId', 'category', 'date', 'timeSlot', 'status'].some(
    (field) => field in changes,
  );
  if (next.workerId && !scheduleChanged) {
    return { order: next };
  }
  if (next.workerId) {
    const result = checkAssignment({
      orderId: next.id,
      category: next.category,
      workerId: next.workerId,
      date: next.date,
      timeSlot: next.timeSlot,
    });
    if (!result.worker) {
      return result;
    }
    next.assignedTo = result.worker.name;
  } else {
    next.workerId = null;
    next.assignedTo = null;
  }
  return { order: next };
}

router.get('/', (req, res) => {
  const list = db.orders.filter((order) => matchesQuery(order, req.query));
  return res.json(list.map(presentOrder));
});

router.get('/:id', (req, res) => {
  const order = findOrder(req, res);
  if (!order) {
    return undefined;
  }
  return res.json(presentOrder(order));
});

router.post('/', adminOnly, (req, res) => {
  const { data, error } = pick(req.body, orderSchema);
  if (error) {
    return badRequest(res, error);
  }
  const draft = {
    id: newId('ord'),
    status: 'new',
    description: '',
    workerId: null,
    assignedTo: null,
  };
  const result = resolveOrder(draft, { ...data, category: legacyCategoryId(data.category) });
  if (!result.order) {
    return res.status(result.status).json({ success: false, message: result.message });
  }
  db.orders.push(result.order);
  save();
  return res.status(201).json(presentOrder(result.order));
});

router.patch('/:id', adminOnly, (req, res) => {
  const order = findOrder(req, res);
  if (!order) {
    return undefined;
  }
  const { data, error } = pick(req.body, orderSchema, { partial: true });
  if (error) {
    return badRequest(res, error);
  }
  if (data.category) {
    data.category = legacyCategoryId(data.category);
  }
  const result = resolveOrder(order, data);
  if (!result.order) {
    return res.status(result.status).json({ success: false, message: result.message });
  }
  Object.assign(order, result.order);
  save();
  return res.json(presentOrder(order));
});

router.delete('/:id', adminOnly, (req, res) => {
  const order = findOrder(req, res);
  if (!order) {
    return undefined;
  }
  db.orders.splice(db.orders.indexOf(order), 1);
  save();
  return res.json({ success: true });
});

router.post('/:id/assign', (req, res) => {
  const order = findOrder(req, res);
  if (!order) {
    return undefined;
  }

  const { workerId, date, timeSlot } = req.body || {};
  if (!workerId || !date || !timeSlot) {
    return badRequest(res, 'workerId, date, and timeSlot are required');
  }
  if (!isIsoDate(String(date))) {
    return badRequest(res, 'Invalid date');
  }
  if (!parseSlot(timeSlot)) {
    return badRequest(res, 'Invalid time slot');
  }

  const result = checkAssignment({
    orderId: order.id,
    category: order.category,
    workerId: String(workerId),
    date: String(date),
    timeSlot: String(timeSlot),
  });
  if (!result.worker) {
    return res.status(result.status).json({ success: false, message: result.message });
  }

  order.status = 'assigned';
  order.workerId = result.worker.id;
  order.assignedTo = result.worker.name;
  order.date = String(date);
  order.timeSlot = String(timeSlot);
  save();

  return res.json(presentOrder(order));
});

router.post('/:id/status', (req, res) => {
  const order = findOrder(req, res);
  if (!order) {
    return undefined;
  }

  const status = req.body && req.body.status;
  if (status !== 'completed' && status !== 'cancelled') {
    return badRequest(res, 'Invalid status');
  }
  if (status === 'completed' && order.status !== 'assigned') {
    return badRequest(res, 'Only an assigned order can be completed');
  }
  if (status === 'cancelled' && order.status !== 'new' && order.status !== 'assigned') {
    return badRequest(res, 'This order can no longer be cancelled');
  }

  order.status = status;
  save();
  return res.json(presentOrder(order));
});

module.exports = router;
