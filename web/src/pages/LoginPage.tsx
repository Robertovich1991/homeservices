import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Button, FormError, TextField } from '../components/ui'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useAuth } from '../context/auth'
import { useLanguage } from '../context/language'
import { errorText } from '../i18n'

const LoginPage = () => {
  const { user, ready, notice, login } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from
  if (ready && user) return <Navigate to={from && from !== '/login' ? from : '/board'} replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError(t('login.missingBody'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await login(username.trim(), password)
    } catch (caught) {
      setError(errorText(t, caught))
      setBusy(false)
    }
  }

  const shownError = error ?? (notice ? t(notice) : null)

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher compact />
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-bold tracking-wider text-muted uppercase">{t('login.kicker')}</p>
            <h1 className="text-3xl font-extrabold text-primary">{t('login.title')}</h1>
            <p className="mt-2 text-sm text-muted">{t('login.subtitle')}</p>
          </div>
          <TextField
            label={t('login.username')}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            required
          />
          <TextField
            label={t('login.password')}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <FormError message={shownError} />
          <Button type="submit" busy={busy} className="w-full py-3">
            {t('login.submit')}
          </Button>
        </form>
      </div>
    </main>
  )
}

export default LoginPage
