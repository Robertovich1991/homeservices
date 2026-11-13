const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupApp, login } = require('./helpers');

const { app, cleanup } = setupApp();
const agent = request(app);
let auth;

before(async () => {
  auth = { Authorization: `Bearer ${await login(agent)}` };
});

after(cleanup);

const newOrder = {
  title: 'Replace kitchen tap',
  category: 'plumbing',
  address: 'Main st 1',
  clientName: 'Test Client',
  clientPhone: '+374 91 000 000',
  date: '2026-11-20',
  timeSlot: '10:00 - 12:00',
};

test('order CRUD with validation', async () => {
  const missing = await agent.post('/api/orders').set(auth).send({ ...newOrder, title: '' });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.message, 'title is invalid');

  const badSlot = await agent.post('/api/orders').set(auth).send({ ...newOrder, timeSlot: '12:00 - 10:00' });
  assert.equal(badSlot.status, 400);

  const badCategory = await agent.post('/api/orders').set(auth).send({ ...newOrder, category: 'roofing' });
  assert.equal(badCategory.status, 400);
  assert.equal(badCategory.body.message, 'Category not found');

  const created = await agent.post('/api/orders').set(auth).send(newOrder);
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'new');
  const id = created.body.id;

  const assigned = await agent.patch(`/api/orders/${id}`).set(auth).send({ workerId: 'wrk-aram' });
  assert.equal(assigned.status, 200);
  assert.equal(assigned.body.status, 'assigned');
  assert.equal(assigned.body.assignedTo, 'Арам Казарян');

  const unassigned = await agent.patch(`/api/orders/${id}`).set(auth).send({ workerId: null });
  assert.equal(unassigned.body.status, 'new');
  assert.equal(unassigned.body.assignedTo, null);

  const empty = await agent.patch(`/api/orders/${id}`).set(auth).send({});
  assert.equal(empty.status, 400);

  const removed = await agent.delete(`/api/orders/${id}`).set(auth);
  assert.equal(removed.status, 200);
  assert.equal((await agent.get(`/api/orders/${id}`).set(auth)).status, 404);
});

test('order edits run trade and overlap checks', async () => {
  const wrongTrade = await agent.post('/api/orders').set(auth).send({ ...newOrder, workerId: 'wrk-nune' });
  assert.equal(wrongTrade.status, 400);
  assert.equal(wrongTrade.body.message, 'Worker does not cover this trade');

  // ord-102 has wrk-aram booked on 2026-10-24 14:00 - 16:00.
  const clash = await agent
    .post('/api/orders')
    .set(auth)
    .send({ ...newOrder, date: '2026-10-24', timeSlot: '15:00 - 17:00', workerId: 'wrk-aram' });
  assert.equal(clash.status, 409);

  const assign = await agent
    .post('/api/orders/ord-101/assign')
    .set(auth)
    .send({ workerId: 'wrk-aram', date: '2026-10-24', timeSlot: '13:00 - 15:00' });
  assert.equal(assign.status, 409);
});

test('category filter accepts ids and legacy names', async () => {
  const byId = await agent.get('/api/orders?category=painting').set(auth);
  const byName = await agent.get(`/api/orders?category=${encodeURIComponent('Покраска')}`).set(auth);
  assert.ok(byId.body.length > 0);
  assert.deepEqual(byId.body.map((o) => o.id), byName.body.map((o) => o.id));
});

test('worker CRUD guards active assignments', async () => {
  const bad = await agent.post('/api/workers').set(auth).send({ name: 'X', phone: 'abc', category: 'plumbing' });
  assert.equal(bad.status, 400);

  const created = await agent
    .post('/api/workers')
    .set(auth)
    .send({ name: 'New Worker', phone: '+374 99 111 222', category: 'cleaning' });
  assert.equal(created.status, 201);

  const renamed = await agent.patch(`/api/workers/${created.body.id}`).set(auth).send({ name: 'Renamed' });
  assert.equal(renamed.body.name, 'Renamed');
  assert.equal((await agent.delete(`/api/workers/${created.body.id}`).set(auth)).status, 200);

  // wrk-gevorg has assigned order ord-108.
  const busyDelete = await agent.delete('/api/workers/wrk-gevorg').set(auth);
  assert.equal(busyDelete.status, 409);
  const busyTrade = await agent.patch('/api/workers/wrk-gevorg').set(auth).send({ category: 'cleaning' });
  assert.equal(busyTrade.status, 409);
});

test('category CRUD blocks deleting categories in use', async () => {
  const invalid = await agent.post('/api/categories').set(auth).send({ names: { en: 'Roof' }, color: 'red' });
  assert.equal(invalid.status, 400);

  const created = await agent
    .post('/api/categories')
    .set(auth)
    .send({ names: { en: 'Roofing', ru: 'Кровля' }, color: '#AA3366' });
  assert.equal(created.status, 201);
  assert.equal(created.body.id, 'roofing');
  assert.equal(created.body.names.de, 'Roofing');

  const duplicate = await agent
    .post('/api/categories')
    .set(auth)
    .send({ names: { en: 'roofing' }, color: '#AA3366' });
  assert.equal(duplicate.status, 409);

  const updated = await agent.patch('/api/categories/roofing').set(auth).send({ color: '#112233' });
  assert.equal(updated.body.color, '#112233');

  assert.equal((await agent.delete('/api/categories/plumbing').set(auth)).status, 409);
  assert.equal((await agent.delete('/api/categories/roofing').set(auth)).status, 200);
});

test('user management protects the last admin and self', async () => {
  const users = await agent.get('/api/users').set(auth);
  const admin = users.body.find((user) => user.username === 'admin');

  assert.equal((await agent.patch(`/api/users/${admin.id}`).set(auth).send({ role: 'dispatcher' })).status, 409);
  assert.equal((await agent.delete(`/api/users/${admin.id}`).set(auth)).status, 409);

  const weak = await agent
    .post('/api/users')
    .set(auth)
    .send({ username: 'ab', name: 'Short', role: 'admin', password: '1' });
  assert.equal(weak.status, 400);

  const second = await agent
    .post('/api/users')
    .set(auth)
    .send({ username: 'boss2', name: 'Second Admin', role: 'admin', password: 'secret2' });
  assert.equal(second.status, 201);
  const duplicate = await agent
    .post('/api/users')
    .set(auth)
    .send({ username: 'BOSS2', name: 'Dup', role: 'admin', password: 'secret2' });
  assert.equal(duplicate.status, 409);

  const demote = await agent.patch(`/api/users/${second.body.id}`).set(auth).send({ role: 'dispatcher' });
  assert.equal(demote.status, 200);
  const reset = await agent.patch(`/api/users/${second.body.id}`).set(auth).send({ password: 'newpass' });
  assert.equal(reset.status, 200);
  assert.ok(await login(agent, 'boss2', 'newpass'));
  assert.equal((await agent.delete(`/api/users/${second.body.id}`).set(auth)).status, 200);
});

test('stats summarise orders for a date', async () => {
  assert.equal((await agent.get('/api/stats?date=bad').set(auth)).status, 400);
  const res = await agent.get('/api/stats?date=2026-10-24').set(auth);
  assert.equal(res.status, 200);
  assert.equal(res.body.day.assigned, 2);
  assert.ok(res.body.byCategory.plumbing >= 3);
  const aram = res.body.workers.find((worker) => worker.id === 'wrk-aram');
  assert.equal(aram.hours, 2);
});
