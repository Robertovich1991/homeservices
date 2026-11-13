const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { orders: seedOrders } = require('./mockOrders');

const file = config.storeFile;

const seedCategories = [
  {
    id: 'plumbing',
    names: { en: 'Plumbing', ru: 'Сантехника', de: 'Sanitär' },
    color: '#1F6F8B',
  },
  {
    id: 'cleaning',
    names: { en: 'Cleaning', ru: 'Чистота', de: 'Reinigung' },
    color: '#2A9D8F',
  },
  {
    id: 'painting',
    names: { en: 'Painting', ru: 'Покраска', de: 'Malerarbeiten' },
    color: '#C17C3A',
  },
];

const LEGACY_CATEGORY_IDS = {
  Сантехника: 'plumbing',
  Чистота: 'cleaning',
  Покраска: 'painting',
};

const seedWorkers = [
  { id: 'wrk-aram', name: 'Арам Казарян', phone: '+374 91 200 101', category: 'plumbing' },
  { id: 'wrk-sona', name: 'Сона Петросян', phone: '+374 93 200 102', category: 'plumbing' },
  { id: 'wrk-nune', name: 'Нуне Мелконян', phone: '+374 77 200 201', category: 'cleaning' },
  { id: 'wrk-ani', name: 'Ани Саргсян', phone: '+374 98 200 202', category: 'cleaning' },
  { id: 'wrk-gevorg', name: 'Геворг Арутюнян', phone: '+374 94 200 301', category: 'painting' },
  { id: 'wrk-mariam', name: 'Мариам Оганесян', phone: '+374 55 200 302', category: 'painting' },
];

function newId(prefix) {
  return `${prefix}-${crypto.randomBytes(5).toString('hex')}`;
}

function legacyCategoryId(value) {
  return LEGACY_CATEGORY_IDS[value] || value;
}

function withWorkerIds(orders, workers) {
  return orders.map((order) => {
    const worker = workers.find((item) => item.name === order.assignedTo);
    return { ...order, workerId: worker ? worker.id : null };
  });
}

function seedAdmin() {
  let password = config.adminPassword;
  if (!password) {
    password = '123456';
    if (!config.isTest) {
      console.warn(
        `[store] ADMIN_PASSWORD is not set; seeded "${config.adminUsername}" with the demo password. Do not use this in production.`,
      );
    }
  }
  return {
    id: newId('usr'),
    username: config.adminUsername,
    name: 'Administrator',
    role: 'admin',
    passwordHash: bcrypt.hashSync(password, 10),
    disabled: false,
  };
}

function migrate(data) {
  let changed = false;
  if (!Array.isArray(data.categories)) {
    data.categories = seedCategories.map((category) => ({ ...category, names: { ...category.names } }));
    changed = true;
  }
  if (!Array.isArray(data.users) || data.users.length === 0) {
    data.users = [seedAdmin()];
    changed = true;
  }
  for (const record of [...data.workers, ...data.orders]) {
    const id = legacyCategoryId(record.category);
    if (id !== record.category) {
      record.category = id;
      changed = true;
    }
  }
  return changed;
}

function writeAtomic(data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file);
}

function load() {
  if (!fs.existsSync(file)) {
    const workers = seedWorkers.map((worker) => ({ ...worker }));
    const orders = withWorkerIds(seedOrders, workers).map((order) => ({
      ...order,
      category: legacyCategoryId(order.category),
    }));
    const data = { workers, orders };
    migrate(data);
    writeAtomic(data);
    return data;
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(parsed.workers) || !Array.isArray(parsed.orders)) {
    throw new Error('Dispatch store is invalid');
  }
  if (migrate(parsed)) {
    writeAtomic(parsed);
  }
  return parsed;
}

const db = load();

function save() {
  writeAtomic(db);
}

function presentOrder(order) {
  const worker = db.workers.find((item) => item.id === order.workerId);
  return {
    ...order,
    workerPhone: worker ? worker.phone : null,
  };
}

function presentUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    disabled: Boolean(user.disabled),
  };
}

module.exports = {
  db,
  save,
  newId,
  presentOrder,
  presentUser,
  legacyCategoryId,
};
