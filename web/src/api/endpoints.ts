import { request } from './client'
import type {
  Category,
  CategoryInput,
  Order,
  OrderInput,
  OrderStatus,
  Schedule,
  Stats,
  User,
  UserCreateInput,
  UserUpdateInput,
  Worker,
  WorkerInput,
} from './types'

type Ok = { success: true }

export type OrderFilters = {
  category?: string
  status?: string
  date?: string
  q?: string
}

export const api = {
  login: (username: string, password: string) =>
    request<{ success: true; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    }),
  me: () => request<{ success: true; user: User }>('/auth/me'),

  orders: (filters: OrderFilters = {}) => request<Order[]>('/orders', { query: filters }),
  order: (id: string) => request<Order>(`/orders/${encodeURIComponent(id)}`),
  createOrder: (input: OrderInput) => request<Order>('/orders', { method: 'POST', body: input }),
  updateOrder: (id: string, input: Partial<OrderInput>) =>
    request<Order>(`/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: input }),
  deleteOrder: (id: string) => request<Ok>(`/orders/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  assignOrder: (id: string, body: { workerId: string; date: string; timeSlot: string }) =>
    request<Order>(`/orders/${encodeURIComponent(id)}/assign`, { method: 'POST', body }),
  setOrderStatus: (id: string, status: Extract<OrderStatus, 'completed' | 'cancelled'>) =>
    request<Order>(`/orders/${encodeURIComponent(id)}/status`, { method: 'POST', body: { status } }),

  workers: (query: { category?: string; date?: string; timeSlot?: string; excludeOrderId?: string } = {}) =>
    request<Worker[]>('/workers', { query }),
  createWorker: (input: WorkerInput) => request<Worker>('/workers', { method: 'POST', body: input }),
  updateWorker: (id: string, input: Partial<WorkerInput>) =>
    request<Worker>(`/workers/${encodeURIComponent(id)}`, { method: 'PATCH', body: input }),
  deleteWorker: (id: string) => request<Ok>(`/workers/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  schedule: (date: string) => request<Schedule>('/schedule', { query: { date } }),

  categories: () => request<Category[]>('/categories'),
  createCategory: (input: CategoryInput) =>
    request<Category>('/categories', { method: 'POST', body: input }),
  updateCategory: (id: string, input: Partial<CategoryInput>) =>
    request<Category>(`/categories/${encodeURIComponent(id)}`, { method: 'PATCH', body: input }),
  deleteCategory: (id: string) =>
    request<Ok>(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  users: () => request<User[]>('/users'),
  createUser: (input: UserCreateInput) => request<User>('/users', { method: 'POST', body: input }),
  updateUser: (id: string, input: UserUpdateInput) =>
    request<User>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: input }),
  deleteUser: (id: string) => request<Ok>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  stats: (date: string) => request<Stats>('/stats', { query: { date } }),
}
