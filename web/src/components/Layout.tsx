import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../context/auth'
import { useLanguage } from '../context/language'
import type { TranslationKey } from '../i18n'
import { Button, focusRing } from './ui'

type NavItem = { to: string; label: TranslationKey; end?: boolean }

const DISPATCH_LINKS: NavItem[] = [
  { to: '/board', label: 'nav.board' },
  { to: '/orders', label: 'nav.orders' },
  { to: '/settings', label: 'nav.settings' },
]

const ADMIN_LINKS: NavItem[] = [
  { to: '/admin', label: 'nav.dashboard', end: true },
  { to: '/admin/orders', label: 'nav.adminOrders' },
  { to: '/admin/workers', label: 'nav.workers' },
  { to: '/admin/users', label: 'nav.users' },
  { to: '/admin/categories', label: 'nav.categories' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-xl px-3 py-2 text-sm font-semibold transition ${focusRing} ${
    isActive ? 'bg-primary text-white' : 'text-ink hover:bg-accent'
  }`

const Layout = () => {
  const { user, isAdmin, logout } = useAuth()
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => setMenuOpen((open) => !open)
  const closeMenu = () => setMenuOpen(false)

  const renderLinks = (items: NavItem[]) => (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink to={item.to} end={item.end} className={linkClass} onClick={closeMenu}>
            {t(item.label)}
          </NavLink>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="min-h-screen lg:flex">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t('nav.skip')}
      </a>
      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <span className="font-extrabold text-primary">{t('login.title')}</span>
        <button
          type="button"
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-controls="app-nav"
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.menu')}
          className={`rounded-lg border border-line px-3 py-1.5 text-lg ${focusRing}`}
        >
          {menuOpen ? '×' : '☰'}
        </button>
      </header>
      <aside
        id="app-nav"
        className={`${menuOpen ? 'block' : 'hidden'} border-b border-line bg-white p-4 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0`}
      >
        <div className="mb-6 hidden lg:block">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">{t('login.kicker')}</p>
          <p className="text-xl font-extrabold text-primary">{t('login.title')}</p>
        </div>
        <nav aria-label={t('app.title')} className="flex flex-col gap-6">
          {renderLinks(DISPATCH_LINKS)}
          {isAdmin ? (
            <div>
              <p className="mb-2 px-3 text-xs font-bold tracking-wider text-muted uppercase">{t('nav.admin')}</p>
              {renderLinks(ADMIN_LINKS)}
            </div>
          ) : null}
        </nav>
        <div className="mt-8 border-t border-line pt-4">
          <p className="truncate text-sm font-bold">{user?.name}</p>
          <p className="mb-3 text-xs text-muted">{user ? t(`role.${user.role}`) : null}</p>
          <Button variant="secondary" className="w-full" onClick={logout}>
            {t('auth.logout')}
          </Button>
        </div>
      </aside>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
