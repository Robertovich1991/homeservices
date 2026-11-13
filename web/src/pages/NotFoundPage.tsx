import { Link } from 'react-router'
import { EmptyState, focusRing } from '../components/ui'
import { useLanguage } from '../context/language'

const NotFoundPage = () => {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <EmptyState>{t('error.pageNotFound')}</EmptyState>
      <Link to="/board" className={`font-bold text-primary hover:underline ${focusRing}`}>
        {t('nav.board')}
      </Link>
    </div>
  )
}

export default NotFoundPage
