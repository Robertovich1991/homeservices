const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { setupApp } = require('./helpers');

const legacy = {
  workers: [{ id: 'wrk-1', name: 'Old Worker', phone: '+374 91 000 001', category: 'Чистота' }],
  orders: [
    {
      id: 'ord-1',
      title: 'Old order',
      category: 'Сантехника',
      status: 'new',
      date: '2026-10-25',
      timeSlot: '10:00 - 12:00',
      workerId: null,
      assignedTo: null,
    },
  ],
};

const { store, file, cleanup } = setupApp({ seed: legacy });

after(cleanup);

test('legacy store is migrated to category ids, categories and an admin user', () => {
  assert.equal(store.db.workers[0].category, 'cleaning');
  assert.equal(store.db.orders[0].category, 'plumbing');
  assert.deepEqual(
    store.db.categories.map((category) => category.id),
    ['plumbing', 'cleaning', 'painting'],
  );
  assert.equal(store.db.users.length, 1);
  assert.equal(store.db.users[0].role, 'admin');

  const onDisk = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(onDisk.orders[0].category, 'plumbing');
  assert.ok(onDisk.users[0].passwordHash.startsWith('$2'));
});
