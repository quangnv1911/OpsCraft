import AppProviders from '@/providers/AppProviders'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const enableTanstackRouterDevtools = process.env.NODE_ENV === 'development'

export const Route = createRootRoute({
  component: () => (
    <AppProviders>
      <Outlet />
      {enableTanstackRouterDevtools && <TanStackRouterDevtools />}
      <ReactQueryDevtools initialIsOpen={false} />
    </AppProviders>
  ),
})
