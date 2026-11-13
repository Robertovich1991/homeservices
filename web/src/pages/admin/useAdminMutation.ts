import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useLanguage } from '../../context/language'
import { useToast } from '../../context/toast'
import { errorText } from '../../i18n'

export type Editing<T> = { mode: 'create' } | { mode: 'edit'; item: T } | null

/**
 * Wraps an admin write: on success it refreshes every cached query (the admin data set is small),
 * shows a toast and calls `onDone`; on failure it keeps the translated error for inline display.
 */
export const useAdminMutation = <TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  { successMessage, onDone }: { successMessage: string; onDone?: () => void },
) => {
  const { t } = useLanguage()
  const { notify } = useToast()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn,
    onMutate: () => setError(null),
    onSuccess: () => {
      queryClient.invalidateQueries()
      notify(successMessage)
      onDone?.()
    },
    onError: (caught) => setError(errorText(t, caught)),
  })

  return { ...mutation, error, clearError: () => setError(null) }
}
