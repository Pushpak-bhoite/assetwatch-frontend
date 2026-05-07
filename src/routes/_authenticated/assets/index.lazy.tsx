import { createLazyFileRoute } from '@tanstack/react-router'
import Assets from '@/features/assets'

export const Route = createLazyFileRoute('/_authenticated/assets/')({
  component: Assets,
})
