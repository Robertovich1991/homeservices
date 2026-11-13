import {
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { useLanguage } from '../context/language'
import { Button, focusRing } from './ui'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
}

/** Uses the native <dialog> so focus is trapped and Esc closes it without extra code. */
const Modal = ({ open, title, onClose, children, footer, onSubmit }: ModalProps) => {
  const { t } = useLanguage()
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      const target =
        dialog.querySelector<HTMLElement>('[data-autofocus]') ??
        dialog.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')
      target?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const handleCancel = (event: SyntheticEvent) => {
    event.preventDefault()
    onClose()
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === ref.current) onClose()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit?.(event)
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-auto w-[min(100%-2rem,36rem)] rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/40"
    >
      {open ? (
        <form onSubmit={handleSubmit} noValidate className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id={titleId} className="text-lg font-extrabold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className={`rounded-lg px-2 text-2xl leading-none text-muted hover:text-ink ${focusRing}`}
            >
              ×
            </button>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div> : null}
        </form>
      ) : null}
    </dialog>
  )
}

type ConfirmDialogProps = {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onClose: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  busy,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => {
  const { t } = useLanguage()
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      onSubmit={onConfirm}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-autofocus>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button type="submit" variant="danger" busy={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-muted">{body}</p>
      {error ? (
        <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  )
}

export default Modal
