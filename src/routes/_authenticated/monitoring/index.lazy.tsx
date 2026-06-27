import { createLazyFileRoute } from '@tanstack/react-router'
import Monitoring from '@/features/monitoring'

export const Route = createLazyFileRoute('/_authenticated/monitoring/')({
  component: Monitoring,
})
