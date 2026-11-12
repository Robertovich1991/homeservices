const fs = require('fs');
const path = require('path');
const { orders: seedOrders } = require('./mockOrders');

const file = path.join(__dirname, 'store.json');

const seedWorkers = [
  {
    id: 'wrk-aram',
    name: 'Арам Казарян',
    phone: '+374 91 200 101',
    category: 'Сантехника',
  },
  {
    id: 'wrk-sona',
    name: 'Сона Петросян',
    phone: '+374 93 200 102',
    category: 'Сантехника',
  },
  {
    id: 'wrk-nune',
    name: 'Нуне Мелконян',
    phone: '+374 77 200 201',
    category: 'Чистота',
  },
  {
    id: 'wrk-ani',
    name: 'Ани Саргсян',
    phone: '+374 98 200 202',
    category: 'Чистота',
  },
  {
    id: 'wrk-gevorg',
    name: 'Геворг Арутюнян',
    phone: '+374 94 200 301',
    category: 'Покраска',
  },
  {
    id: 'wrk-mariam',
    name: 'Мариам Оганесян',
    phone: '+374 55 200 302',
    category: 'Покраска',
  },
];

function withWorkerIds(orders, workers) {
  return orders.map((order) => {
    const worker = workers.find((item) => item.name === order.assignedTo);
    return { ...order, workerId: worker ? worker.id : null };
  });
}

function load() {
  if (!fs.existsSync(file)) {
    const data = {
      workers: seedWorkers,
      orders: withWorkerIds(seedOrders, seedWorkers),
    };
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return data;
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(parsed.workers) || !Array.isArray(parsed.orders)) {
    throw new Error('Dispatch store is invalid');
  }
  return parsed;
}

const db = load();

function save() {
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
}

function presentOrder(order) {
  const worker = db.workers.find((item) => item.id === order.workerId);
  return {
    ...order,
    workerPhone: worker ? worker.phone : null,
  };
}

module.exports = {
  db,
  save,
  presentOrder,
};
