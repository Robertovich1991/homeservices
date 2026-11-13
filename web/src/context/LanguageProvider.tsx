import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Language } from '../api/types'
import { isLanguage, translate } from '../i18n'
import { LanguageContext } from './language'

const STORAGE_KEY = 'dispatch.language'

const initialLanguage = (): Language => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isLanguage(stored) ? stored : 'ru'
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    document.title = translate(language, 'app.title')
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage: (next: Language) => {
        localStorage.setItem(STORAGE_KEY, next)
        setLanguageState(next)
      },
      t: (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
        translate(language, key, vars),
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
