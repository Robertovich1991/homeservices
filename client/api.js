import {Platform} from 'react-native';

/**
 * Simulators / emulators:
 *   iOS Simulator → localhost
 *   Android Emulator → 10.0.2.2
 * Physical device: set USE_PHYSICAL_DEVICE = true and LAN_IP to your machine.
 */
const USE_PHYSICAL_DEVICE = false;
const LAN_IP = '192.168.100.114';

const host = USE_PHYSICAL_DEVICE
  ? LAN_IP
  : Platform.OS === 'android'
    ? '10.0.2.2'
    : 'localhost';

export const API_BASE_URL = `http://${host}:5000/api`;

async function request(path, {method = 'GET', token, body} = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const failure = new Error('network');
    failure.code = 'network';
    failure.url = API_BASE_URL;
    throw failure;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const failure = new Error(data.message || 'http');
    failure.code = data.message ? 'server' : 'http';
    failure.status = response.status;
    throw failure;
  }

  return data;
}

export function loginRequest(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: {username, password},
  });
}

export function fetchOrders(token, {category, status, date, q} = {}) {
  const params = new URLSearchParams();
  if (category && category !== 'Все') {
    params.set('category', category);
  }
  if (status && status !== 'all') {
    params.set('status', status);
  }
  if (date) {
    params.set('date', date);
  }
  if (q && q.trim()) {
    params.set('q', q.trim());
  }
  const query = params.toString();
  return request(`/orders${query ? `?${query}` : ''}`, {token});
}

export function fetchOrderById(token, id) {
  return request(`/orders/${id}`, {token});
}

export function fetchWorkers(token, {category, date, timeSlot, excludeOrderId} = {}) {
  const params = new URLSearchParams();
  if (category) {
    params.set('category', category);
  }
  if (date) {
    params.set('date', date);
  }
  if (timeSlot) {
    params.set('timeSlot', timeSlot);
  }
  if (excludeOrderId) {
    params.set('excludeOrderId', excludeOrderId);
  }
  const query = params.toString();
  return request(`/workers${query ? `?${query}` : ''}`, {token});
}

export function fetchSchedule(token, date) {
  return request(`/schedule?date=${encodeURIComponent(date)}`, {token});
}

export function assignOrder(token, id, payload) {
  return request(`/orders/${id}/assign`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateOrderStatus(token, id, status) {
  return request(`/orders/${id}/status`, {
    method: 'POST',
    token,
    body: {status},
  });
}
