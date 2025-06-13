import { RootLayout } from '@/layout';
import authStore from '@/stores/authStore';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { isAuthenticated } = authStore.getState();
    // if (!isAuthenticated) {
    //   throw redirect({ to: '/login' });
    // }
  },
  component: RootLayout,
});
