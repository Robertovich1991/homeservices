const { findConflict } = require('../data/schedule');
const { db } = require('../data/store');

/**
 * Checks that `workerId` can take an order in `category` on `date` / `timeSlot`.
 * Returns `{ worker }` on success or `{ status, message }` describing the failure.
 */
function checkAssignment({ orderId, category, workerId, date, timeSlot }) {
  const worker = db.workers.find((item) => item.id === workerId);
  if (!worker) {
    return { status: 400, message: 'Worker not found' };
  }
  if (worker.category !== category) {
    return { status: 400, message: 'Worker does not cover this trade' };
  }
  const clash = findConflict(db.orders, {
    workerId: worker.id,
    date,
    timeSlot,
    excludeOrderId: orderId,
  });
  if (clash) {
    return {
      status: 409,
      message: 'That worker is already booked for an overlapping time slot',
    };
  }
  return { worker };
}

module.exports = { checkAssignment };
