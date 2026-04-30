import { createLazyFileRoute } from '@tanstack/react-router'
import UsersAgGrid from '@/features/users/index-ag-grid'

export const Route = createLazyFileRoute('/_authenticated/users/')({
  component: UsersAgGrid,
})
