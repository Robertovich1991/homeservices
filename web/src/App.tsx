import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { RequireAdmin, RequireAuth } from './auth/guards'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import DayBoardPage from './pages/DayBoardPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import OrderDetailPage from './pages/OrderDetailPage'
import OrdersPage from './pages/OrdersPage'
import SettingsPage from './pages/SettingsPage'

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'))
const WorkersPage = lazy(() => import('./pages/admin/WorkersPage'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'))

const lazyPage = (page: ReactNode) => <Suspense fallback={<Spinner />}>{page}</Suspense>

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/board" replace /> },
          { path: 'board', element: <DayBoardPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'settings', element: <SettingsPage /> },
          {
            path: 'admin',
            element: <RequireAdmin />,
            children: [
              { index: true, element: lazyPage(<DashboardPage />) },
              { path: 'orders', element: lazyPage(<AdminOrdersPage />) },
              { path: 'workers', element: lazyPage(<WorkersPage />) },
              { path: 'users', element: lazyPage(<UsersPage />) },
              { path: 'categories', element: lazyPage(<CategoriesPage />) },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

const App = () => <RouterProvider router={router} />

export default App
