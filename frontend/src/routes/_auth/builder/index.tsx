import BuilderPage from '@/pages/builder'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/builder/')({
  component: () => <BuilderPage />,
})
