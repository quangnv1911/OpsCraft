import { RootLayout } from '@/layout'
import authStore from '@/stores/authStore'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { toast } from 'react-toastify'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { isAuthenticated } = authStore.getState()
    if (!isAuthenticated) {
      toast.error('Please login to continue')
      throw redirect({ to: '/login' })
    }
  },
  component: RootLayout,
})
