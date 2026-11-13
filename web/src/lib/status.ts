import type { OrderStatus } from '../api/types'

export const ORDER_STATUSES: OrderStatus[] = ['new', 'assigned', 'completed', 'cancelled']

export const STATUS_CLASSES: Record<OrderStatus, string> = {
  new: 'bg-warning-bg text-warning',
  assigned: 'bg-success-bg text-success',
  completed: 'bg-done-bg text-done',
  cancelled: 'bg-danger-bg text-danger',
}

export const isClosed = (status: OrderStatus) => status === 'completed' || status === 'cancelled'
