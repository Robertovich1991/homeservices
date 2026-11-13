import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { api } from '../api/endpoints'
import { useLanguage } from '../context/language'

export const CATEGORIES_KEY = ['categories']

const FALLBACK_COLOR = '#1F6F8B'

export const useCategories = () => {
  const { language } = useLanguage()
  const query = useQuery({ queryKey: CATEGORIES_KEY, queryFn: api.categories, staleTime: 60_000 })
  const categories = useMemo(() => query.data ?? [], [query.data])

  const label = useCallback(
    (id: string) => {
      const category = categories.find((item) => item.id === id)
      if (!category) return id
      return category.names[language] || category.names.en || id
    },
    [categories, language],
  )

  const color = useCallback(
    (id: string) => categories.find((item) => item.id === id)?.color ?? FALLBACK_COLOR,
    [categories],
  )

  return { categories, label, color, isLoading: query.isLoading, error: query.error }
}
