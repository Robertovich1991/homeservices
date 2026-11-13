import { Navigate, Outlet, useLocation } from 'react-router'
import { Spinner } from '../components/ui'
import { useAuth } from '../context/auth'

export const RequireAuth = () => {
  const { user, ready, signedOut } = useAuth()
  const location = useLocation()
  if (!ready) return <Spinner fullscreen />
  if (!user) {
    const state = signedOut ? undefined : { from: location.pathname + location.search }
    return <Navigate to="/login" replace state={state} />
  }
  return <Outlet />
}

export const RequireAdmin = () => {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/board" replace />
  return <Outlet />
}
