import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLanguage } from './language'
import { ToastContext, type ToastTone } from './toast'

type Toast = { id: number; message: string; tone: ToastTone }

const TIMEOUT_MS = 4000

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage()
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++
      setToasts((current) => [...current.slice(-3), { id, message, tone }])
      window.setTimeout(() => dismiss(id), TIMEOUT_MS)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
              toast.tone === 'error' ? 'bg-danger' : 'bg-success'
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={t('common.close')}
              className="rounded px-1 leading-none opacity-80 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
