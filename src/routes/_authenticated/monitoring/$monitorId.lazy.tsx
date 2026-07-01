import { createLazyFileRoute } from '@tanstack/react-router'
import MonitorDetailPage from '@/features/monitoring/monitor-detail-page'

export const Route = createLazyFileRoute('/_authenticated/monitoring/$monitorId')({
  component: MonitorDetailPage,
})
