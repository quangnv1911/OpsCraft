import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
const enableTanstackRouterDevtools = process.env.NODE_ENV === 'development';

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {enableTanstackRouterDevtools && <TanStackRouterDevtools />}
    </>
  ),
});
