import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '../api/endpoints'
import CategoryChips, { ALL_CATEGORIES } from '../components/CategoryChips'
import OrderCard from '../components/OrderCard'
import { Button, EmptyState, ErrorState, PageHeader, SelectField, Spinner, TextField } from '../components/ui'
import { useLanguage } from '../context/language'
import { errorText } from '../i18n'
import { ORDER_STATUSES } from '../lib/status'

const SEARCH_DELAY_MS = 300

type Filters = { category: string; status: string; date: string; q: string }

const readFilters = (params: URLSearchParams): Filters => ({
  category: params.get('category') || ALL_CATEGORIES,
  status: params.get('status') || 'all',
  date: params.get('date') || '',
  q: params.get('q') || '',
})

const toParams = ({ category, status, date, q }: Filters) => {
  const next = new URLSearchParams()
  if (category !== ALL_CATEGORIES) next.set('category', category)
  if (status !== 'all') next.set('status', status)
  if (date) next.set('date', date)
  if (q) next.set('q', q)
  return next
}

const OrdersPage = () => {
  const { t } = useLanguage()
  const [params, setParams] = useSearchParams()
  // Filters live in state so quick successive changes never read a stale URL; the URL only mirrors them.
  const [{ category, status, date, q }, setFilters] = useState(() => readFilters(params))
  const [search, setSearch] = useState(q)

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  useEffect(() => {
    setParams(toParams({ category, status, date, q }), { replace: true })
  }, [category, status, date, q, setParams])

  useEffect(() => {
    const trimmed = search.trim()
    if (trimmed === q) return
    const timer = window.setTimeout(() => setFilters((current) => ({ ...current, q: trimmed })), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [search, q])

  const filters = {
    category: category === ALL_CATEGORIES ? undefined : category,
    status: status === 'all' ? undefined : status,
    date: date || undefined,
    q: q || undefined,
  }
  const query = useQuery({ queryKey: ['orders', filters], queryFn: () => api.orders(filters) })
  const filtered = Boolean(filters.category || filters.status || filters.date || filters.q)

  const renderList = () => {
    if (query.isLoading) return <Spinner />
    if (query.error) return <ErrorState message={`${t('orders.loadFailed')}: ${errorText(t, query.error)}`} onRetry={() => query.refetch()} />
    const orders = query.data ?? []
    if (orders.length === 0) return <EmptyState>{filtered ? t('orders.emptyFiltered') : t('orders.empty')}</EmptyState>
    return (
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => (
          <li key={order.id}>
            <OrderCard order={order} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div>
      <PageHeader title={t('orders.title')} />
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4">
        <CategoryChips selected={category} onSelect={(value) => updateFilter('category', value)} />
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <TextField
            label={t('orders.search')}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('orders.searchPlaceholder')}
          />
          <SelectField label={t('orders.statusFilter')} value={status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="all">{t('status.all')}</option>
            {ORDER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {t(`status.${item}`)}
              </option>
            ))}
          </SelectField>
          <TextField label={t('orders.pickDate')} type="date" value={date} onChange={(event) => updateFilter('date', event.target.value)} />
          <Button variant="ghost" onClick={() => updateFilter('date', '')} aria-disabled={!date}>
            {t('orders.clearDate')}
          </Button>
        </div>
      </div>
      {renderList()}
    </div>
  )
}

export default OrdersPage
