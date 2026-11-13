import { createContext, useContext } from 'react'
import type { User } from '../api/types'
import type { TranslationKey } from '../i18n'

export type AuthContextValue = {
  user: User | null
  ready: boolean
  isAdmin: boolean
  notice: TranslationKey | null
  signedOut: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
