import type { Language } from '../api/types'

const pad = (value: number) => String(value).padStart(2, '0')

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const todayIso = () => toIsoDate(new Date())

export const parseIsoDate = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export const shiftIsoDate = (iso: string, days: number) => {
  const parsed = parseIsoDate(iso)
  if (!parsed) return iso
  return toIsoDate(new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + days))
}

const LOCALES: Record<Language, string> = { en: 'en-GB', ru: 'ru-RU', de: 'de-DE' }

export const formatDay = (iso: string, language: Language) => {
  const parsed = parseIsoDate(iso)
  if (!parsed) return iso
  return new Intl.DateTimeFormat(LOCALES[language], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}
