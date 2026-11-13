import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { api } from '../api/endpoints'
import { useCategories } from '../categories/useCategories'
import OrderCard from '../components/OrderCard'
import { Button, Card, EmptyState, ErrorState, Spinner, TextField, focusRing } from '../components/ui'
import { useLanguage } from '../context/language'
import { errorText } from '../i18n'
import { formatDay, parseIsoDate, shiftIsoDate, todayIso } from '../lib/dates'

const DayBoardPage = () => {
  const { t, language } = useLanguage()
  const { categories, label, color } = useCategories()
  const [params, setParams] = useSearchParams()
  const today = todayIso()
  const requested = params.get('date') || ''
  const date = parseIsoDate(requested) ? requested : today

  const query = useQuery({ queryKey: ['schedule', date], queryFn: () => api.schedule(date) })

  const goTo = (next: string) => {
    if (!parseIsoDate(next)) return
    setParams(next === today ? {} : { date: next }, { replace: true })
  }

  const renderBoard = () => {
    if (query.isLoading) return <Spinner />
    if (query.error || !query.data) {
      return <ErrorState message={`${t('board.loadFailed')}: ${errorText(t, query.error)}`} onRetry={() => query.refetch()} />
    }
    const { unassigned, workers } = query.data
    const knownIds = new Set(categories.map((category) => category.id))
    const tradeIds = [...categories.map((category) => category.id), ...new Set(workers.map((worker) => worker.category).filter((id) => !knownIds.has(id)))]

    return (
      <div className="flex flex-col gap-8">
        <section aria-labelledby="unassigned-heading">
          <h2 id="unassigned-heading" className="mb-3 text-sm font-extrabold tracking-wide text-muted uppercase">
            {t('board.unassigned')} ({unassigned.length})
          </h2>
          {unassigned.length === 0 ? (
            <EmptyState>{t('board.emptyUnassigned')}</EmptyState>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {unassigned.map((order) => (
                <li key={order.id}>
                  <OrderCard order={order} />
                </li>
              ))}
            </ul>
          )}
        </section>
        {tradeIds.map((trade) => {
          const group = workers.filter((worker) => worker.category === trade)
          if (group.length === 0) return null
          return (
            <section key={trade} aria-labelledby={`trade-${trade}`}>
              <h2 id={`trade-${trade}`} className="mb-3 text-sm font-extrabold tracking-wide uppercase" style={{ color: color(trade) }}>
                {label(trade)}
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {group.map((worker) => (
                  <Card key={worker.id} className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{worker.name}</p>
                        <p className="text-sm text-muted">{worker.phone}</p>
                      </div>
                      {worker.free ? (
                        <span className="text-sm font-bold text-success">{t('board.free')}</span>
                      ) : (
                        <span className="text-sm font-bold text-warning">{t('worker.busy')}</span>
                      )}
                    </div>
                    {worker.jobs.length > 0 ? (
                      <ul className="flex flex-col gap-2">
                        {worker.jobs.map((order) => (
                          <li key={order.id}>
                            <OrderCard order={order} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </Card>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">{t('board.title')}</h1>
          <p className="text-muted first-letter:uppercase">{formatDay(date, language)}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button variant="secondary" onClick={() => goTo(shiftIsoDate(date, -1))} aria-label={t('board.previousDay')}>
            ‹
          </Button>
          <TextField label={t('board.pickDay')} type="date" value={date} onChange={(event) => goTo(event.target.value)} />
          <Button variant="secondary" onClick={() => goTo(shiftIsoDate(date, 1))} aria-label={t('board.nextDay')}>
            ›
          </Button>
          {date !== today ? (
            <Button variant="ghost" onClick={() => goTo(today)}>
              {t('board.today')}
            </Button>
          ) : null}
          <Link to="/orders" className={`rounded-xl px-4 py-2.5 text-sm font-bold text-primary hover:bg-accent ${focusRing}`}>
            {t('board.allOrders')}
          </Link>
        </div>
      </div>
      {renderBoard()}
    </div>
  )
}

export default DayBoardPage
