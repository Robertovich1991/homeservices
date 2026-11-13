import {
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import type { OrderStatus } from '../api/types'
import { useCategories } from '../categories/useCategories'
import { useLanguage } from '../context/language'
import { STATUS_CLASSES } from '../lib/status'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark border border-primary',
  secondary: 'bg-white text-primary border border-line hover:bg-accent',
  danger: 'bg-white text-danger border border-danger hover:bg-danger-bg',
  ghost: 'text-primary hover:bg-accent border border-transparent',
}

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  busy?: boolean
}

export const Button = ({ variant = 'primary', busy, className = '', children, disabled, ...rest }: ButtonProps) => (
  <button
    type="button"
    {...rest}
    disabled={disabled || busy}
    aria-busy={busy || undefined}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${BUTTON_VARIANTS[variant]} ${className}`}
  >
    {busy ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : null}
    {children}
  </button>
)

export const Spinner = ({ fullscreen }: { fullscreen?: boolean }) => {
  const { t } = useLanguage()
  return (
    <div className={`flex items-center justify-center p-10 ${fullscreen ? 'min-h-screen' : ''}`} role="status">
      <span className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}

const inputClass = `w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base text-ink placeholder:text-muted disabled:bg-bg ${focusRing} aria-invalid:border-danger`

type FieldShellProps = { id: string; label: string; hint?: string; children: ReactNode }

const FieldShell = ({ id, label, hint, children }: FieldShellProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-semibold text-ink">
      {label}
    </label>
    {children}
    {hint ? (
      <p id={`${id}-hint`} className="text-xs text-muted">
        {hint}
      </p>
    ) : null}
  </div>
)

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }

export const TextField = ({ label, hint, id, ...rest }: TextFieldProps) => {
  const generated = useId()
  const fieldId = id ?? generated
  return (
    <FieldShell id={fieldId} label={label} hint={hint}>
      <input id={fieldId} aria-describedby={hint ? `${fieldId}-hint` : undefined} className={inputClass} {...rest} />
    </FieldShell>
  )
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }

export const SelectField = ({ label, hint, id, children, ...rest }: SelectFieldProps) => {
  const generated = useId()
  const fieldId = id ?? generated
  return (
    <FieldShell id={fieldId} label={label} hint={hint}>
      <select id={fieldId} aria-describedby={hint ? `${fieldId}-hint` : undefined} className={inputClass} {...rest}>
        {children}
      </select>
    </FieldShell>
  )
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }

export const TextAreaField = ({ label, id, ...rest }: TextAreaFieldProps) => {
  const generated = useId()
  const fieldId = id ?? generated
  return (
    <FieldShell id={fieldId} label={label}>
      <textarea id={fieldId} rows={3} className={inputClass} {...rest} />
    </FieldShell>
  )
}

const Badge = ({ className = '', style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${className}`} style={style}>
    {children}
  </span>
)

export const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const { t } = useLanguage()
  return <Badge className={STATUS_CLASSES[status] ?? STATUS_CLASSES.new}>{t(`status.${status}`)}</Badge>
}

export const CategoryBadge = ({ category }: { category: string }) => {
  const { label, color } = useCategories()
  const tint = color(category)
  return (
    <Badge style={{ backgroundColor: `${tint}1A`, color: tint }}>
      {label(category)}
    </Badge>
  )
}

export const PageHeader = ({ title, actions }: { title: string; actions?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </div>
)

export const Card = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`rounded-2xl border border-line bg-white ${className}`}>{children}</div>
)

export const EmptyState = ({ children }: { children: ReactNode }) => (
  <p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-muted">{children}</p>
)

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/30 bg-danger-bg p-6 text-center" role="alert">
      <p className="font-semibold text-danger">{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      ) : null}
    </div>
  )
}

export const FormError = ({ message }: { message: string | null }) =>
  message ? (
    <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-semibold text-danger" role="alert">
      {message}
    </p>
  ) : null
