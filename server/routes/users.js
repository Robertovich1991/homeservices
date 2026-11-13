const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { USERNAME, rules, pick, badRequest, notFound, conflict } = require('../lib/validate');
const { db, newId, save, presentUser } = require('../data/store');

const router = Router();

const ROLES = ['admin', 'dispatcher'];

const createSchema = {
  username: { rule: rules.pattern(USERNAME), required: true },
  name: { rule: rules.text(100), required: true },
  role: { rule: rules.oneOf(ROLES), required: true },
  password: { rule: rules.password(), required: true },
};

const updateSchema = {
  name: { rule: rules.text(100) },
  role: { rule: rules.oneOf(ROLES) },
  disabled: { rule: rules.boolean() },
  password: { rule: rules.password() },
};

function isActiveAdmin(user) {
  return user.role === 'admin' && !user.disabled;
}

function activeAdminCount() {
  return db.users.filter(isActiveAdmin).length;
}

function findUser(req, res) {
  const user = db.users.find((item) => item.id === req.params.id);
  if (!user) {
    notFound(res, 'User not found');
  }
  return user;
}

router.get('/', (_req, res) => {
  return res.json(db.users.map(presentUser));
});

router.post('/', (req, res) => {
  const { data, error } = pick(req.body, createSchema);
  if (error) {
    return badRequest(res, error);
  }
  const taken = db.users.some(
    (user) => user.username.toLowerCase() === data.username.toLowerCase(),
  );
  if (taken) {
    return conflict(res, 'Username already exists');
  }
  const user = {
    id: newId('usr'),
    username: data.username,
    name: data.name,
    role: data.role,
    passwordHash: bcrypt.hashSync(data.password, 10),
    disabled: false,
  };
  db.users.push(user);
  save();
  return res.status(201).json(presentUser(user));
});

router.patch('/:id', (req, res) => {
  const user = findUser(req, res);
  if (!user) {
    return undefined;
  }
  const { data, error } = pick(req.body, updateSchema, { partial: true });
  if (error) {
    return badRequest(res, error);
  }

  const isSelf = user.id === req.user.id;
  const losesAdmin =
    isActiveAdmin(user) && ((data.role && data.role !== 'admin') || data.disabled === true);
  if (losesAdmin && isSelf) {
    return conflict(res, 'You cannot remove your own admin access');
  }
  if (losesAdmin && activeAdminCount() <= 1) {
    return conflict(res, 'At least one active admin is required');
  }

  if (data.name) {
    user.name = data.name;
  }
  if (data.role) {
    user.role = data.role;
  }
  if (typeof data.disabled === 'boolean') {
    user.disabled = data.disabled;
  }
  if (data.password) {
    user.passwordHash = bcrypt.hashSync(data.password, 10);
  }
  save();
  return res.json(presentUser(user));
});

router.delete('/:id', (req, res) => {
  const user = findUser(req, res);
  if (!user) {
    return undefined;
  }
  if (user.id === req.user.id) {
    return conflict(res, 'You cannot delete your own account');
  }
  if (isActiveAdmin(user) && activeAdminCount() <= 1) {
    return conflict(res, 'At least one active admin is required');
  }
  db.users.splice(db.users.indexOf(user), 1);
  save();
  return res.json({ success: true });
});

module.exports = router;
