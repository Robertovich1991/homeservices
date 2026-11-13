const { isIsoDate, parseSlot } = require('../data/schedule');

const PHONE = /^\+?[0-9 ()-]{5,25}$/;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const USERNAME = /^[a-zA-Z0-9._-]{3,32}$/;

const rules = {
  text: (max) => (value) => {
    if (typeof value !== 'string') {
      return { error: true };
    }
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > max) {
      return { error: true };
    }
    return { value: trimmed };
  },
  optionalText: (max) => (value) => {
    if (value == null || value === '') {
      return { value: '' };
    }
    if (typeof value !== 'string' || value.trim().length > max) {
      return { error: true };
    }
    return { value: value.trim() };
  },
  pattern: (regex) => (value) => {
    if (typeof value !== 'string' || !regex.test(value.trim())) {
      return { error: true };
    }
    return { value: value.trim() };
  },
  oneOf: (allowed) => (value) => (allowed.includes(value) ? { value } : { error: true }),
  boolean: () => (value) => (typeof value === 'boolean' ? { value } : { error: true }),
  isoDate: () => (value) => (typeof value === 'string' && isIsoDate(value) ? { value } : { error: true }),
  timeSlot: () => (value) => (typeof value === 'string' && parseSlot(value) ? { value } : { error: true }),
  password: () => (value) =>
    typeof value === 'string' && value.length >= 6 && value.length <= 128 ? { value } : { error: true },
  nullableId: () => (value) => {
    if (value === null || value === '') {
      return { value: null };
    }
    return typeof value === 'string' && value.length <= 64 ? { value } : { error: true };
  },
};

/**
 * Picks and validates the fields described by `schema` from `body`.
 * Each schema entry is `{ rule, required }`. With `partial`, missing fields are skipped,
 * which is how PATCH endpoints accept a subset of fields.
 */
function pick(body, schema, { partial = false } = {}) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const data = {};
  for (const [field, { rule, required }] of Object.entries(schema)) {
    if (!(field in source) || source[field] === undefined) {
      if (required && !partial) {
        return { error: `${field} is required` };
      }
      continue;
    }
    const result = rule(source[field]);
    if (result.error) {
      return { error: `${field} is invalid` };
    }
    data[field] = result.value;
  }
  if (partial && Object.keys(data).length === 0) {
    return { error: 'No fields to update' };
  }
  return { data };
}

function badRequest(res, message) {
  return res.status(400).json({ success: false, message });
}

function notFound(res, message) {
  return res.status(404).json({ success: false, message });
}

function conflict(res, message) {
  return res.status(409).json({ success: false, message });
}

module.exports = {
  PHONE,
  HEX_COLOR,
  USERNAME,
  rules,
  pick,
  badRequest,
  notFound,
  conflict,
};
