import { createLazyFileRoute } from '@tanstack/react-router'
import Observability from '@/features/observability'

export const Route = createLazyFileRoute('/_authenticated/observability/')({
  component: Observability,
})
