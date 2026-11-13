import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../api/endpoints'
import type { Order, OrderInput, OrderStatus } from '../../api/types'
import { useCategories } from '../../categories/useCategories'
import Modal from '../../components/Modal'
import { Button, FormError, SelectField, TextAreaField, TextField } from '../../components/ui'
import { useLanguage } from '../../context/language'
import { todayIso } from '../../lib/dates'
import { slotsIncluding } from '../../lib/slots'
import { ORDER_STATUSES } from '../../lib/status'
import { useAdminMutation } from './useAdminMutation'

type OrderFormModalProps = {
  order: Order | null
  onClose: () => void
}

const toForm = (order: Order | null, defaultCategory: string): OrderInput => ({
  title: order?.title ?? '',
  category: order?.category ?? defaultCategory,
  address: order?.address ?? '',
  clientName: order?.clientName ?? '',
  clientPhone: order?.clientPhone ?? '',
  date: order?.date ?? todayIso(),
  timeSlot: order?.timeSlot ?? '10:00 - 12:00',
  description: order?.description ?? '',
  workerId: order?.workerId ?? null,
  status: order?.status,
})

const changedFields = (initial: OrderInput, current: OrderInput) =>
  Object.fromEntries(
    (Object.keys(current) as (keyof OrderInput)[])
      .filter((key) => current[key] !== initial[key])
      .map((key) => [key, current[key]]),
  ) as Partial<OrderInput>

const OrderFormModal = ({ order, onClose }: OrderFormModalProps) => {
  const { t } = useLanguage()
  const { categories, label } = useCategories()
  const [initial] = useState(() => toForm(order, categories[0]?.id ?? ''))
  const [form, setForm] = useState(initial)
  const [localError, setLocalError] = useState<string | null>(null)
  const [invalidField, setInvalidField] = useState<keyof OrderInput | null>(null)
  const fieldProps = (key: keyof OrderInput) => ({ name: key, 'aria-invalid': invalidField === key || undefined })

  const workersQuery = useQuery({
    queryKey: ['workers', { category: form.category }],
    queryFn: () => api.workers({ category: form.category }),
    enabled: Boolean(form.category),
  })

  const save = useAdminMutation(
    (input: OrderInput) => {
      if (!order) {
        const { status: _ignored, ...create } = input
        return api.createOrder(create)
      }
      return api.updateOrder(order.id, changedFields(initial, input))
    },
    { successMessage: t('common.saved'), onDone: onClose },
  )

  const update = <K extends keyof OrderInput>(key: K, value: OrderInput[K]) => {
    setLocalError(null)
    setInvalidField(null)
    save.clearError()
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'category' && value !== current.category) next.workerId = null
      return next
    })
  }

  const handleSubmit = () => {
    const required: (keyof OrderInput)[] = ['title', 'category', 'address', 'clientName', 'clientPhone', 'date', 'timeSlot']
    const missing = required.find((key) => !String(form[key] ?? '').trim())
    if (missing) {
      setLocalError(t('error.fieldRequired', { field: t(`field.${missing}`) }))
      setInvalidField(missing)
      document.querySelector<HTMLElement>(`dialog [name="${missing}"]`)?.focus()
      return
    }
    if (order && Object.keys(changedFields(initial, form)).length === 0) {
      onClose()
      return
    }
    setLocalError(null)
    save.mutate(form)
  }

  return (
    <Modal
      open
      title={order ? t('admin.orders.edit') : t('admin.orders.new')}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" busy={save.isPending}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <TextField label={t('field.title')} {...fieldProps('title')} value={form.title} onChange={(event) => update('title', event.target.value)} maxLength={120} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t('field.category')} {...fieldProps('category')} value={form.category} onChange={(event) => update('category', event.target.value)} required>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {label(category.id)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('field.workerId')}
          value={form.workerId ?? ''}
          onChange={(event) => update('workerId', event.target.value || null)}
          disabled={workersQuery.isLoading}
          hint={workersQuery.data && workersQuery.data.length === 0 ? t('worker.none') : undefined}
        >
          <option value="">{t('admin.orders.noWorker')}</option>
          {(workersQuery.data ?? []).map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField label={t('field.address')} {...fieldProps('address')} value={form.address} onChange={(event) => update('address', event.target.value)} maxLength={200} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t('field.clientName')} {...fieldProps('clientName')} value={form.clientName} onChange={(event) => update('clientName', event.target.value)} maxLength={100} required />
        <TextField
          label={t('field.clientPhone')}
          {...fieldProps('clientPhone')}
          type="tel"
          value={form.clientPhone}
          onChange={(event) => update('clientPhone', event.target.value)}
          placeholder="+374 91 000 000"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t('field.date')} {...fieldProps('date')} type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required />
        <SelectField label={t('field.timeSlot')} {...fieldProps('timeSlot')} value={form.timeSlot} onChange={(event) => update('timeSlot', event.target.value)} required>
          {slotsIncluding(form.timeSlot).map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </SelectField>
      </div>
      {order ? (
        <SelectField label={t('field.status')} value={form.status} onChange={(event) => update('status', event.target.value as OrderStatus)}>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </SelectField>
      ) : null}
      <TextAreaField
        label={`${t('field.description')} (${t('common.optional')})`}
        value={form.description}
        onChange={(event) => update('description', event.target.value)}
        maxLength={2000}
      />
      <FormError message={localError ?? save.error} />
    </Modal>
  )
}

export default OrderFormModal
