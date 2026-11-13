import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/endpoints'
import type { Order } from '../../api/types'
import { useCategories } from '../../categories/useCategories'
import { ConfirmDialog } from '../../components/Modal'
import { Button, CategoryBadge, EmptyState, ErrorState, PageHeader, SelectField, Spinner, StatusBadge, TextField, focusRing } from '../../components/ui'
import { useLanguage } from '../../context/language'
import { errorText } from '../../i18n'
import { ORDER_STATUSES } from '../../lib/status'
import OrderFormModal from './OrderFormModal'
import { Table, Td } from './shared'
import { useAdminMutation, type Editing } from './useAdminMutation'

const AdminOrdersPage = () => {
  const { t } = useLanguage()
  const { categories, label } = useCategories()
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const q = useDeferredValue(search.trim())
  const [editing, setEditing] = useState<Editing<Order>>(null)
  const [deleting, setDeleting] = useState<Order | null>(null)

  const filters = { category: category || undefined, status: status || undefined, q: q || undefined }
  const query = useQuery({ queryKey: ['orders', filters], queryFn: () => api.orders(filters) })
  const remove = useAdminMutation((id: string) => api.deleteOrder(id), {
    successMessage: t('common.deleted'),
    onDone: () => setDeleting(null),
  })

  const renderTable = () => {
    if (query.isLoading) return <Spinner />
    if (query.error) return <ErrorState message={errorText(t, query.error)} onRetry={() => query.refetch()} />
    const orders = [...(query.data ?? [])].sort((a, b) => b.date.localeCompare(a.date) || a.timeSlot.localeCompare(b.timeSlot))
    if (orders.length === 0) return <EmptyState>{t('orders.emptyFiltered')}</EmptyState>
    return (
      <Table head={[t('field.title'), t('field.category'), t('field.date'), t('field.status'), t('field.workerId'), t('common.actions')]}>
        {orders.map((order) => (
          <tr key={order.id}>
            <Td>
              <Link to={`/orders/${encodeURIComponent(order.id)}`} className={`font-bold text-primary hover:underline ${focusRing}`}>
                {order.title}
              </Link>
              <p className="text-xs text-muted">{order.clientName}</p>
            </Td>
            <Td>
              <CategoryBadge category={order.category} />
            </Td>
            <Td className="whitespace-nowrap">
              {order.date}
              <p className="text-xs text-muted">{order.timeSlot}</p>
            </Td>
            <Td>
              <StatusBadge status={order.status} />
            </Td>
            <Td>{order.assignedTo ?? t('common.none')}</Td>
            <Td className="whitespace-nowrap">
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing({ mode: 'edit', item: order })} aria-label={`${t('common.edit')}: ${order.title}`}>
                  {t('common.edit')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    remove.clearError()
                    setDeleting(order)
                  }}
                  aria-label={`${t('common.delete')}: ${order.title}`}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('admin.orders.title')}
        actions={
          <Button onClick={() => setEditing({ mode: 'create' })} disabled={categories.length === 0}>
            + {t('admin.orders.new')}
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-3">
        <TextField label={t('orders.search')} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('orders.searchPlaceholder')} />
        <SelectField label={t('orders.categoryFilter')} value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">{t('category.all')}</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {label(item.id)}
            </option>
          ))}
        </SelectField>
        <SelectField label={t('orders.statusFilter')} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">{t('status.all')}</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {t(`status.${item}`)}
            </option>
          ))}
        </SelectField>
      </div>
      {renderTable()}
      {editing ? <OrderFormModal order={editing.mode === 'edit' ? editing.item : null} onClose={() => setEditing(null)} /> : null}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('admin.orders.deleteTitle')}
        body={t('admin.orders.deleteBody', { name: deleting?.title ?? '' })}
        confirmLabel={t('common.delete')}
        busy={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

export default AdminOrdersPage
