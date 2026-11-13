import { createContext, useContext } from 'react'
import type { Language } from '../api/types'
import type { Translate } from '../i18n'

export type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: Translate
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
