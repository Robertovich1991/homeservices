const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Points the store at a fresh temp file and loads the app.
 * Must run before anything requires ../config or ../data/store.
 */
function setupApp({ seed } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-test-'));
  const file = path.join(dir, 'store.json');
  if (seed) {
    fs.writeFileSync(file, JSON.stringify(seed));
  }
  process.env.NODE_ENV = 'test';
  process.env.STORE_FILE = file;
  delete process.env.ADMIN_PASSWORD;
  const app = require('../app');
  const store = require('../data/store');
  return { app, store, file, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

async function login(agent, username = 'admin', password = '123456') {
  const res = await agent.post('/api/auth/login').send({ username, password });
  return res.body.token;
}

module.exports = { setupApp, login };
