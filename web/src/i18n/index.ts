import { ApiError } from '../api/client'
import type { Language } from '../api/types'
import de from './de'
import en, { type TranslationKey } from './en'
import ru from './ru'

export type { TranslationKey }

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
]

const tables: Record<Language, Record<TranslationKey, string>> = { en, ru, de }

export const isLanguage = (value: unknown): value is Language =>
  value === 'en' || value === 'ru' || value === 'de'

export const translate = (
  language: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => {
  const value = tables[language][key] ?? en[key] ?? key
  if (!vars) return value
  return value.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    vars[name] == null ? match : String(vars[name]),
  )
}

const SERVER_MESSAGE_KEYS: Record<string, TranslationKey> = {
  'Invalid username or password': 'error.invalidLogin',
  'Too many login attempts, try again later': 'error.tooManyLogins',
  'Invalid token': 'error.sessionExpired',
  'Missing token': 'error.sessionExpired',
  Forbidden: 'error.forbidden',
  'Order not found': 'error.notFound',
  'workerId, date, and timeSlot are required': 'error.assignRequired',
  'Worker not found': 'error.workerNotFound',
  'Worker does not cover this trade': 'error.workerTrade',
  'Invalid time slot': 'error.badSlot',
  'Invalid date': 'error.badDate',
  'That worker is already booked for an overlapping time slot': 'error.overlap',
  'An assigned order needs a worker': 'error.needsWorker',
  'Invalid status': 'error.badStatus',
  'Only an assigned order can be completed': 'error.completeOnlyAssigned',
  'This order can no longer be cancelled': 'error.cancelClosed',
  'Worker has assigned orders': 'error.workerHasOrders',
  'Worker has assigned orders in the current trade': 'error.workerTradeLocked',
  'Category is still in use': 'error.categoryInUse',
  'Category already exists': 'error.categoryExists',
  'Category not found': 'error.categoryNotFound',
  'User not found': 'error.userNotFound',
  'Username already exists': 'error.usernameTaken',
  'At least one active admin is required': 'error.lastAdmin',
  'You cannot remove your own admin access': 'error.selfAdmin',
  'You cannot delete your own account': 'error.selfDelete',
  'No fields to update': 'error.noChanges',
}

const FIELD_ERROR = /^(\w+) is (invalid|required)$/

const fieldLabel = (t: Translate, field: string) => {
  const key = `field.${field}` as TranslationKey
  return key in en ? t(key) : field
}

export const errorText = (t: Translate, error: unknown) => {
  if (!(error instanceof ApiError)) return t('error.generic')
  if (error.code === 'network') return t('error.network', { url: error.url })
  if (error.code === 'http') return t('error.requestFailed', { status: error.status })
  const known = SERVER_MESSAGE_KEYS[error.message]
  if (known) return t(known)
  const field = FIELD_ERROR.exec(error.message)
  if (field) {
    const label = fieldLabel(t, field[1])
    return field[2] === 'required'
      ? t('error.fieldRequired', { field: label })
      : t('error.fieldInvalid', { field: label })
  }
  return error.message || t('error.generic')
}
