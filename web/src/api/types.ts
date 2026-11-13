export type OrderStatus = 'new' | 'assigned' | 'completed' | 'cancelled'

export type Role = 'admin' | 'dispatcher'

export type Language = 'en' | 'ru' | 'de'

export type User = {
  id: string
  username: string
  name: string
  role: Role
  disabled: boolean
}

export type Category = {
  id: string
  names: Record<Language, string>
  color: string
}

export type Order = {
  id: string
  title: string
  category: string
  status: OrderStatus
  address: string
  clientName: string
  clientPhone: string
  date: string
  timeSlot: string
  description: string
  assignedTo: string | null
  workerId: string | null
  workerPhone: string | null
}

export type Worker = {
  id: string
  name: string
  phone: string
  category: string
  busy?: boolean
}

export type ScheduleWorker = Worker & {
  free: boolean
  jobs: Order[]
}

export type Schedule = {
  date: string
  unassigned: Order[]
  workers: ScheduleWorker[]
}

export type Stats = {
  date: string
  totals: { orders: number; workers: number; users: number; categories: number }
  byStatus: Record<OrderStatus, number>
  byCategory: Record<string, number>
  day: { orders: number; unassigned: number; assigned: number }
  workers: { id: string; name: string; category: string; jobs: number; hours: number }[]
}

export type OrderInput = {
  title: string
  category: string
  address: string
  clientName: string
  clientPhone: string
  date: string
  timeSlot: string
  description: string
  workerId: string | null
  status?: OrderStatus
}

export type WorkerInput = Pick<Worker, 'name' | 'phone' | 'category'>

export type UserCreateInput = {
  username: string
  name: string
  role: Role
  password: string
}

export type UserUpdateInput = Partial<{
  name: string
  role: Role
  disabled: boolean
  password: string
}>

export type CategoryInput = Pick<Category, 'names' | 'color'>
