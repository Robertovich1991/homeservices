import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../api/endpoints'
import { useCategories } from '../../categories/useCategories'
import { Card, ErrorState, PageHeader, Spinner, TextField } from '../../components/ui'
import { useLanguage } from '../../context/language'
import { errorText } from '../../i18n'
import { parseIsoDate, todayIso } from '../../lib/dates'
import { ORDER_STATUSES } from '../../lib/status'

const STATUS_BAR: Record<string, string> = {
  new: 'bg-warning',
  assigned: 'bg-success',
  completed: 'bg-done',
  cancelled: 'bg-danger',
}

type BarProps = { label: string; value: number; max: number; valueLabel?: string; className?: string; color?: string }

const Bar = ({ label, value, max, valueLabel, className, color }: BarProps) => (
  <div>
    <div className="mb-1 flex justify-between gap-3 text-sm">
      <span className="font-semibold">{label}</span>
      <span className="whitespace-nowrap text-muted">{valueLabel ?? value}</span>
    </div>
    <div className="h-2.5 overflow-hidden rounded-full bg-bg" aria-hidden>
      <div className={`h-full rounded-full ${className ?? ''}`} style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: color }} />
    </div>
  </div>
)

const Stat = ({ label, value }: { label: string; value: number }) => (
  <Card className="p-4">
    <p className="text-sm text-muted">{label}</p>
    <p className="text-3xl font-extrabold text-primary">{value}</p>
  </Card>
)

const DashboardPage = () => {
  const { t } = useLanguage()
  const { label, color } = useCategories()
  const [date, setDate] = useState(todayIso())
  const query = useQuery({ queryKey: ['stats', date], queryFn: () => api.stats(date), enabled: Boolean(parseIsoDate(date)) })

  const renderBody = () => {
    if (query.isLoading) return <Spinner />
    if (query.error || !query.data) return <ErrorState message={errorText(t, query.error)} onRetry={() => query.refetch()} />
    const stats = query.data
    const statusMax = Math.max(...Object.values(stats.byStatus), 1)
    const categoryMax = Math.max(...Object.values(stats.byCategory), 1)
    const hoursMax = Math.max(...stats.workers.map((worker) => worker.hours), 1)

    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={t('admin.dashboard.orders')} value={stats.totals.orders} />
          <Stat label={t('admin.dashboard.workers')} value={stats.totals.workers} />
          <Stat label={t('admin.dashboard.users')} value={stats.totals.users} />
          <Stat label={t('admin.dashboard.categories')} value={stats.totals.categories} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-extrabold">{t('admin.dashboard.byStatus')}</h2>
            {ORDER_STATUSES.map((status) => (
              <Bar key={status} label={t(`status.${status}`)} value={stats.byStatus[status] ?? 0} max={statusMax} className={STATUS_BAR[status]} />
            ))}
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-extrabold">{t('admin.dashboard.byCategory')}</h2>
            {Object.entries(stats.byCategory).map(([id, count]) => (
              <Bar key={id} label={label(id)} value={count} max={categoryMax} color={color(id)} />
            ))}
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-extrabold">{t('admin.dashboard.day')}</h2>
            <dl className="grid gap-2">
              {[
                [t('admin.dashboard.dayOrders'), stats.day.orders],
                [t('admin.dashboard.dayUnassigned'), stats.day.unassigned],
                [t('admin.dashboard.dayAssigned'), stats.day.assigned],
              ].map(([name, value]) => (
                <div key={name} className="flex justify-between border-b border-line pb-2 last:border-b-0">
                  <dt className="text-muted">{name}</dt>
                  <dd className="font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <div>
              <h2 className="font-extrabold">{t('admin.dashboard.workload')}</h2>
              <p className="text-xs text-muted">{t('admin.dashboard.workloadHint')}</p>
            </div>
            {stats.workers.map((worker) => (
              <Bar
                key={worker.id}
                label={`${worker.name} · ${t('admin.dashboard.jobs', { count: worker.jobs })}`}
                value={worker.hours}
                valueLabel={t('admin.dashboard.hours', { hours: worker.hours })}
                max={hoursMax}
                color={color(worker.category)}
              />
            ))}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('admin.dashboard.title')}
        actions={<TextField label={t('admin.dashboard.day')} type="date" value={date} onChange={(event) => event.target.value && setDate(event.target.value)} />}
      />
      {renderBody()}
    </div>
  )
}

export default DashboardPage
