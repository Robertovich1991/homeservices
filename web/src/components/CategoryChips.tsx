import { useCategories } from '../categories/useCategories'
import { useLanguage } from '../context/language'
import { focusRing } from './ui'

export const ALL_CATEGORIES = 'all'

type CategoryChipsProps = {
  selected: string
  onSelect: (category: string) => void
}

const CategoryChips = ({ selected, onSelect }: CategoryChipsProps) => {
  const { t } = useLanguage()
  const { categories, label, color } = useCategories()
  const options = [ALL_CATEGORIES, ...categories.map((category) => category.id)]

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('orders.categoryFilter')}>
      {options.map((id) => {
        const active = selected === id
        const tint = id === ALL_CATEGORIES ? '#1F6F8B' : color(id)
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-pressed={active}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${focusRing}`}
            style={active ? { backgroundColor: tint, borderColor: tint, color: '#fff' } : { borderColor: '#E4E9F0', backgroundColor: '#fff' }}
          >
            {id === ALL_CATEGORIES ? t('category.all') : label(id)}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryChips
