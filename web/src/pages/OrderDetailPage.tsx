import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { api } from '../api/endpoints'
import type { Order } from '../api/types'
import { ConfirmDialog } from '../components/Modal'
import { Button, Card, CategoryBadge, ErrorState, FormError, SelectField, Spinner, StatusBadge, TextField, focusRing } from '../components/ui'
import { useLanguage } from '../context/language'
import { useToast } from '../context/toast'
import { errorText } from '../i18n'
import { slotsIncluding } from '../lib/slots'
import { isClosed } from '../lib/status'

const mapUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
const telUrl = (phone: string) => `tel:${phone.replace(/[^+\d]/g, '')}`

const linkButton = `inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-primary hover:bg-accent ${focusRing}`

const AssignForm = ({ order, onSaved }: { order: Order; onSaved: (order: Order) => void }) => {
  const { t } = useLanguage()
  const { notify } = useToast()
  const [workerId, setWorkerId] = useState(order.workerId ?? '')
  const [date, setDate] = useState(order.date)
  const [timeSlot, setTimeSlot] = useState(order.timeSlot)
  const [error, setError] = useState<string | null>(null)

  const workersQuery = useQuery({
    queryKey: ['workers', { category: order.category, date, timeSlot, excludeOrderId: order.id }],
    queryFn: () => api.workers({ category: order.category, date, timeSlot, excludeOrderId: order.id }),
  })
  const workers = workersQuery.data ?? []

  const assign = useMutation({
    mutationFn: () => api.assignOrder(order.id, { workerId, date, timeSlot }),
    onSuccess: (updated) => {
      setError(null)
      notify(t('order.assignedBody'))
      onSaved(updated)
    },
    onError: (caught) => setError(`${t('order.assignFailed')}: ${errorText(t, caught)}`),
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workerId || !date || !timeSlot) {
      setError(t('order.formBody'))
      return
    }
    if (workers.find((worker) => worker.id === workerId)?.busy) {
      setError(t('error.overlap'))
      return
    }
    assign.mutate()
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold">{t('order.assignSection')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label={t('order.date')}
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setError(null)
            }}
            required
          />
          <SelectField
            label={t('order.slot')}
            value={timeSlot}
            onChange={(event) => {
              setTimeSlot(event.target.value)
              setError(null)
            }}
            required
          >
            {slotsIncluding(timeSlot).map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </SelectField>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold">{t('worker.pick')}</legend>
          {workersQuery.isLoading ? <Spinner /> : null}
          {workersQuery.error ? <FormError message={errorText(t, workersQuery.error)} /> : null}
          {!workersQuery.isLoading && workers.length === 0 ? <p className="text-muted">{t('worker.none')}</p> : null}
          {workers.map((worker) => (
            <label
              key={worker.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                worker.busy ? 'cursor-not-allowed border-line opacity-55' : 'cursor-pointer border-line hover:border-primary'
              } has-checked:border-primary has-checked:bg-accent has-focus-visible:outline-2 has-focus-visible:outline-primary`}
            >
              <input
                type="radio"
                name="worker"
                value={worker.id}
                checked={workerId === worker.id}
                disabled={worker.busy}
                onChange={() => {
                  setWorkerId(worker.id)
                  setError(null)
                }}
                className="size-4 accent-primary"
              />
              <span className="flex-1">
                <span className="block font-bold">{worker.name}</span>
                <span className="block text-sm text-muted">{worker.phone}</span>
              </span>
              {worker.busy ? <span className="text-sm font-bold text-warning">{t('worker.busy')}</span> : null}
            </label>
          ))}
        </fieldset>
        <FormError message={error} />
        <Button type="submit" busy={assign.isPending} className="py-3">
          {order.status === 'assigned' ? t('order.reschedule') : t('order.assign')}
        </Button>
      </form>
    </Card>
  )
}

const OrderDetailPage = () => {
  const { id = '' } = useParams()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const backTo = from?.startsWith('/') && !from.startsWith('//') ? from : '/orders'
  const { t } = useLanguage()
  const { notify } = useToast()
  const queryClient = useQueryClient()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const query = useQuery({ queryKey: ['order', id], queryFn: () => api.order(id) })

  const handleSaved = (updated: Order) => {
    queryClient.setQueryData(['order', id], updated)
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['schedule'] })
    queryClient.invalidateQueries({ queryKey: ['workers'] })
  }

  const statusMutation = useMutation({
    mutationFn: (status: 'completed' | 'cancelled') => api.setOrderStatus(id, status),
    onSuccess: (updated, status) => {
      setConfirmCancel(false)
      notify(status === 'completed' ? t('order.completedBody') : t('order.cancelledBody'))
      handleSaved(updated)
    },
    onError: (caught) => notify(`${t('order.statusFailed')}: ${errorText(t, caught)}`, 'error'),
  })

  if (query.isLoading) return <Spinner />
  if (query.error || !query.data) {
    return <ErrorState message={`${t('order.loadFailed')}: ${errorText(t, query.error)}`} onRetry={() => query.refetch()} />
  }

  const order = query.data
  const closed = isClosed(order.status)
  const rows: [string, string][] = [
    [t('order.client'), order.clientName],
    [t('order.phone'), order.clientPhone],
    [t('order.address'), order.address],
    [t('order.date'), order.date],
    [t('order.slot'), order.timeSlot],
  ]
  if (order.assignedTo) rows.push([t('worker.pick'), order.assignedTo])
  if (order.workerPhone) rows.push([t('order.workerPhone'), order.workerPhone])

  return (
    <div className="flex flex-col gap-6">
      <Link to={backTo} className={`self-start text-sm font-bold text-primary hover:underline ${focusRing}`}>
        ← {t('order.back')}
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <CategoryBadge category={order.category} />
            <StatusBadge status={order.status} />
          </div>
          <h1 className="text-2xl font-extrabold">{order.title}</h1>
          {order.description ? <p className="leading-relaxed text-muted">{order.description}</p> : null}
          <div className="flex flex-wrap gap-2">
            <a className={linkButton} href={telUrl(order.clientPhone)}>
              {t('order.call')}
            </a>
            <a className={linkButton} href={mapUrl(order.address)} target="_blank" rel="noopener noreferrer">
              {t('order.maps')}
            </a>
            {order.workerPhone ? (
              <a className={linkButton} href={telUrl(order.workerPhone)}>
                {t('order.callWorker')}
              </a>
            ) : null}
          </div>
          <Card className="px-4">
            <dl>
              {rows.map(([label, value]) => (
                <div key={label} className="border-b border-line py-3 last:border-b-0">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <div className="flex flex-wrap gap-2">
            {order.status === 'assigned' ? (
              <Button onClick={() => statusMutation.mutate('completed')} busy={statusMutation.isPending && statusMutation.variables === 'completed'}>
                {t('order.complete')}
              </Button>
            ) : null}
            {order.status === 'new' || order.status === 'assigned' ? (
              <Button variant="danger" onClick={() => setConfirmCancel(true)}>
                {t('order.cancel')}
              </Button>
            ) : null}
          </div>
        </div>
        {closed ? (
          <p className="text-muted">{t('order.closedNote')}</p>
        ) : (
          <AssignForm key={`${order.id}-${order.status}-${order.workerId}`} order={order} onSaved={handleSaved} />
        )}
      </div>
      <ConfirmDialog
        open={confirmCancel}
        title={t('order.cancelTitle')}
        body={order.workerId ? t('order.cancelBody') : t('order.cancelBodyNoWorker')}
        confirmLabel={t('order.cancel')}
        cancelLabel={t('order.keep')}
        busy={statusMutation.isPending}
        onConfirm={() => statusMutation.mutate('cancelled')}
        onClose={() => setConfirmCancel(false)}
      />
    </div>
  )
}

export default OrderDetailPage
