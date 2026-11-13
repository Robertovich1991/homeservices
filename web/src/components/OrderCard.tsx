import { Link, useLocation } from 'react-router'
import type { Order } from '../api/types'
import { useLanguage } from '../context/language'
import { CategoryBadge, StatusBadge, focusRing } from './ui'

const OrderCard = ({ order }: { order: Order }) => {
  const { t } = useLanguage()
  const location = useLocation()
  return (
    <Link
      to={`/orders/${encodeURIComponent(order.id)}`}
      state={{ from: location.pathname + location.search }}
      className={`block rounded-2xl border border-line bg-white p-4 transition hover:border-primary hover:shadow-sm ${focusRing}`}
    >
      <div className="mb-2 flex flex-wrap gap-2">
        <CategoryBadge category={order.category} />
        <StatusBadge status={order.status} />
      </div>
      <p className="text-base font-bold text-ink">{order.title}</p>
      <p className="mt-1 text-sm text-muted">{order.address}</p>
      <p className="text-sm text-muted">
        {order.date} · {order.timeSlot}
      </p>
      {order.assignedTo ? (
        <p className="mt-2 text-sm font-semibold text-primary">{t('order.worker', { name: order.assignedTo })}</p>
      ) : null}
    </Link>
  )
}

export default OrderCard
