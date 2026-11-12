function isIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function parseSlot(slot) {
  const match = /^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/.exec(slot || '');
  if (!match) {
    return null;
  }
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  if (end <= start) {
    return null;
  }
  return [start, end];
}

function overlaps(left, right) {
  if (!left || !right) {
    return false;
  }
  return left[0] < right[1] && right[0] < left[1];
}

function findConflict(orders, { workerId, date, timeSlot, excludeOrderId }) {
  const slot = parseSlot(timeSlot);
  if (!slot) {
    return null;
  }
  return (
    orders.find(
      (order) =>
        order.id !== excludeOrderId &&
        order.workerId === workerId &&
        order.date === date &&
        order.status === 'assigned' &&
        overlaps(slot, parseSlot(order.timeSlot)),
    ) || null
  );
}

module.exports = { isIsoDate, parseSlot, overlaps, findConflict };
