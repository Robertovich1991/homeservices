import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setAuthToken, setUnauthorizedHandler } from '../api/client'
import { api } from '../api/endpoints'
import type { User } from '../api/types'
import type { TranslationKey } from '../i18n'
import { AuthContext } from './auth'

const STORAGE_KEY = 'dispatch.session'

type Session = { token: string; user: User }

const tokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

const readSession = (): Session | null => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Session | null
    if (!parsed?.token || !parsed.user || tokenExpired(parsed.token)) return null
    return parsed
  } catch {
    return null
  }
}

const stored = readSession()
setAuthToken(stored?.token ?? null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(stored)
  const [ready, setReady] = useState(!stored)
  const [notice, setNotice] = useState<TranslationKey | null>(null)
  const [signedOut, setSignedOut] = useState(false)

  const persist = useCallback((next: Session | null) => {
    setAuthToken(next?.token ?? null)
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
    setSession(next)
  }, [])

  const endSession = useCallback(
    (reason: TranslationKey | null) => {
      persist(null)
      queryClient.clear()
      setNotice(reason)
    },
    [persist, queryClient],
  )

  useEffect(() => {
    setUnauthorizedHandler(() => endSession('error.sessionExpired'))
    return () => setUnauthorizedHandler(null)
  }, [endSession])

  useEffect(() => {
    if (!stored) return
    api
      .me()
      .then((result) => persist({ token: stored.token, user: result.user }))
      .catch(() => undefined)
      .finally(() => setReady(true))
  }, [persist])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      ready,
      isAdmin: session?.user.role === 'admin',
      notice,
      signedOut,
      login: async (username: string, password: string) => {
        const result = await api.login(username, password)
        setNotice(null)
        setSignedOut(false)
        persist({ token: result.token, user: result.user })
      },
      logout: () => {
        setSignedOut(true)
        endSession(null)
      },
    }),
    [session, ready, notice, signedOut, persist, endSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
