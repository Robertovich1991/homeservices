import { useId } from 'react'
import { isLanguage, LANGUAGES } from '../i18n'
import { useLanguage } from '../context/language'
import { focusRing } from './ui'

const LanguageSwitcher = ({ compact }: { compact?: boolean }) => {
  const { language, setLanguage, t } = useLanguage()
  const id = useId()

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <label htmlFor={id}>{t('settings.language')}</label>
        <select
          id={id}
          value={language}
          onChange={(event) => isLanguage(event.target.value) && setLanguage(event.target.value)}
          className={`rounded-lg border border-line bg-white px-2 py-1 text-sm text-ink ${focusRing}`}
        >
          {LANGUAGES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{t('settings.language')}</legend>
      {LANGUAGES.map((item) => (
        <label
          key={item.code}
          className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-white px-4 py-3 has-checked:border-primary has-checked:bg-accent has-focus-visible:outline-2 has-focus-visible:outline-primary"
        >
          <span className="font-semibold">{item.label}</span>
          <input
            type="radio"
            name="language"
            value={item.code}
            checked={language === item.code}
            onChange={() => setLanguage(item.code)}
            className="size-4 accent-primary"
          />
        </label>
      ))}
    </fieldset>
  )
}

export default LanguageSwitcher
