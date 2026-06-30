import { createLazyFileRoute } from '@tanstack/react-router'
import { MonitorDetails } from '@/features/monitoring/components/monitor-details'

export const Route = createLazyFileRoute('/_authenticated/monitoring/$monitorId')({
  component: MonitorDetails,
})
