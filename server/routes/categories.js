const { Router } = require('express');
const { requireRole } = require('../middleware/auth');
const { HEX_COLOR, rules, pick, badRequest, notFound, conflict } = require('../lib/validate');
const { db, save } = require('../data/store');

const router = Router();
const adminOnly = requireRole('admin');

const LANGUAGES = ['en', 'ru', 'de'];

function namesRule(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: true };
  }
  const en = rules.text(40)(value.en);
  if (en.error) {
    return { error: true };
  }
  const names = { en: en.value };
  for (const language of LANGUAGES.slice(1)) {
    const result = rules.optionalText(40)(value[language]);
    if (result.error) {
      return { error: true };
    }
    names[language] = result.value || en.value;
  }
  return { value: names };
}

const categorySchema = {
  names: { rule: namesRule, required: true },
  color: { rule: rules.pattern(HEX_COLOR), required: true },
};

function slugify(text) {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return slug || 'category';
}

function uniqueId(base) {
  let id = base;
  let suffix = 2;
  while (db.categories.some((category) => category.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function nameTaken(names, exceptId) {
  const wanted = names.en.toLowerCase();
  return db.categories.some(
    (category) => category.id !== exceptId && category.names.en.toLowerCase() === wanted,
  );
}

function findCategory(req, res) {
  const category = db.categories.find((item) => item.id === req.params.id);
  if (!category) {
    notFound(res, 'Category not found');
  }
  return category;
}

router.get('/', (_req, res) => {
  return res.json(db.categories);
});

router.post('/', adminOnly, (req, res) => {
  const { data, error } = pick(req.body, categorySchema);
  if (error) {
    return badRequest(res, error);
  }
  if (nameTaken(data.names)) {
    return conflict(res, 'Category already exists');
  }
  const category = { id: uniqueId(slugify(data.names.en)), ...data };
  db.categories.push(category);
  save();
  return res.status(201).json(category);
});

router.patch('/:id', adminOnly, (req, res) => {
  const category = findCategory(req, res);
  if (!category) {
    return undefined;
  }
  const { data, error } = pick(req.body, categorySchema, { partial: true });
  if (error) {
    return badRequest(res, error);
  }
  if (data.names && nameTaken(data.names, category.id)) {
    return conflict(res, 'Category already exists');
  }
  Object.assign(category, data);
  save();
  return res.json(category);
});

router.delete('/:id', adminOnly, (req, res) => {
  const category = findCategory(req, res);
  if (!category) {
    return undefined;
  }
  const inUse =
    db.orders.some((order) => order.category === category.id) ||
    db.workers.some((worker) => worker.category === category.id);
  if (inUse) {
    return conflict(res, 'Category is still in use');
  }
  db.categories.splice(db.categories.indexOf(category), 1);
  save();
  return res.json({ success: true });
});

module.exports = router;
