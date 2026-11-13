const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupApp, login } = require('./helpers');

const { app, cleanup } = setupApp();
const agent = request(app);
let adminToken;
let dispatcherToken;
let dispatcherId;

before(async () => {
  adminToken = await login(agent);
  const created = await agent
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ username: 'disp1', name: 'Dispatcher One', role: 'dispatcher', password: 'secret1' });
  dispatcherId = created.body.id;
  dispatcherToken = await login(agent, 'disp1', 'secret1');
});

after(cleanup);

test('login rejects wrong password and malformed body', async () => {
  const wrong = await agent.post('/api/auth/login').send({ username: 'admin', password: 'nope' });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.message, 'Invalid username or password');

  const malformed = await agent.post('/api/auth/login').send({ username: ['admin'] });
  assert.equal(malformed.status, 401);
});

test('login returns a token and public user fields only', async () => {
  const res = await agent.post('/api/auth/login').send({ username: 'admin', password: '123456' });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, 'admin');
  assert.equal(res.body.user.passwordHash, undefined);
});

test('protected routes require a valid token', async () => {
  assert.equal((await agent.get('/api/orders')).status, 401);
  const bad = await agent.get('/api/orders').set('Authorization', 'Bearer not-a-jwt');
  assert.equal(bad.status, 401);
});

test('GET /api/auth/me returns the current user', async () => {
  const res = await agent.get('/api/auth/me').set('Authorization', `Bearer ${dispatcherToken}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.username, 'disp1');
});

test('dispatcher can read but not use admin endpoints', async () => {
  const auth = { Authorization: `Bearer ${dispatcherToken}` };
  assert.equal((await agent.get('/api/orders').set(auth)).status, 200);
  assert.equal((await agent.get('/api/categories').set(auth)).status, 200);
  assert.equal((await agent.get('/api/users').set(auth)).status, 403);
  assert.equal((await agent.get('/api/stats?date=2026-10-24').set(auth)).status, 403);
  assert.equal((await agent.post('/api/orders').set(auth).send({})).status, 403);
  assert.equal((await agent.delete('/api/workers/wrk-aram').set(auth)).status, 403);
  assert.equal((await agent.post('/api/categories').set(auth).send({})).status, 403);
});

test('disabling a user revokes existing tokens and blocks login', async () => {
  const disable = await agent
    .patch(`/api/users/${dispatcherId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ disabled: true });
  assert.equal(disable.status, 200);

  const me = await agent.get('/api/auth/me').set('Authorization', `Bearer ${dispatcherToken}`);
  assert.equal(me.status, 401);

  const relogin = await agent.post('/api/auth/login').send({ username: 'disp1', password: 'secret1' });
  assert.equal(relogin.status, 401);
});

test('unknown API routes return JSON 404 and bad JSON returns 400', async () => {
  const missing = await agent.get('/api/nope');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.success, false);

  const badJson = await agent
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"username":');
  assert.equal(badJson.status, 400);
});
