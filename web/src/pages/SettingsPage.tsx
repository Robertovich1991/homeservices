import LanguageSwitcher from '../components/LanguageSwitcher'
import { Button, Card, PageHeader, focusRing } from '../components/ui'
import { useAuth } from '../context/auth'
import { useLanguage } from '../context/language'

const SUPPORT_EMAIL = 'support@homeservices.dispatch'
const SUPPORT_PHONE_DISPLAY = '+374 10 555 010'
const SUPPORT_PHONE_TEL = '+37410555010'

const SettingsPage = () => {
  const { t } = useLanguage()
  const { user, logout } = useAuth()

  return (
    <div className="max-w-xl">
      <PageHeader title={t('settings.title')} />
      <section className="mb-8" aria-labelledby="language-heading">
        <h2 id="language-heading" className="text-lg font-extrabold">
          {t('settings.language')}
        </h2>
        <p className="mb-3 text-sm text-muted">{t('settings.languageHint')}</p>
        <LanguageSwitcher />
      </section>
      <section className="mb-8" aria-labelledby="account-heading">
        <h2 id="account-heading" className="mb-3 text-lg font-extrabold">
          {t('settings.account')}
        </h2>
        <Card className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-bold">{user?.name}</p>
            <p className="text-sm text-muted">
              {user?.username} · {user ? t(`role.${user.role}`) : null}
            </p>
          </div>
          <Button variant="secondary" onClick={logout}>
            {t('auth.logout')}
          </Button>
        </Card>
      </section>
      <section aria-labelledby="support-heading">
        <h2 id="support-heading" className="text-lg font-extrabold">
          {t('settings.support')}
        </h2>
        <p className="mb-3 text-sm text-muted">{t('settings.supportBody')}</p>
        <Card className="px-4">
          <dl>
            <div className="border-b border-line py-3">
              <dt className="text-xs text-muted">{t('settings.email')}</dt>
              <dd>
                <a className={`font-semibold text-primary hover:underline ${focusRing}`} href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </a>
              </dd>
            </div>
            <div className="py-3">
              <dt className="text-xs text-muted">{t('settings.phone')}</dt>
              <dd>
                <a className={`font-semibold text-primary hover:underline ${focusRing}`} href={`tel:${SUPPORT_PHONE_TEL}`}>
                  {SUPPORT_PHONE_DISPLAY}
                </a>
              </dd>
            </div>
          </dl>
        </Card>
      </section>
    </div>
  )
}

export default SettingsPage
