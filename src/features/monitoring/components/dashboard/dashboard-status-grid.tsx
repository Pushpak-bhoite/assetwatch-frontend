/**
 * Dashboard Status Grid Component
 *
 * Displays all monitors in a grid with their current status.
 * Clickable to navigate to monitor details.
 */

import { useNavigate } from '@tanstack/react-router'
import { Globe, Activity, Server, Network } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardStatusGrid, DashboardMonitorStatus } from '../../types'
import { cn } from '@/lib/utils'

interface DashboardStatusGridProps {
  data: DashboardStatusGrid | null
  isLoading?: boolean
}

// Get icon for monitor type
function getTypeIcon(type: string) {
  switch (type) {
    case 'http':
      return Globe
    case 'ping':
      return Activity
    case 'port':
      return Server
    case 'dns':
      return Network
    default:
      return Globe
  }
}

// Get status color
function getStatusColor(status: string) {
  switch (status) {
    case 'up':
      return 'bg-green-500'
    case 'down':
      return 'bg-red-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'paused':
      return 'bg-gray-400'
    default:
      return 'bg-gray-300'
  }
}

// Get status border color for card
function getStatusBorderColor(status: string) {
  switch (status) {
    case 'up':
      return 'border-l-green-500'
    case 'down':
      return 'border-l-red-500'
    case 'warning':
      return 'border-l-yellow-500'
    case 'paused':
      return 'border-l-gray-400'
    default:
      return 'border-l-gray-300'
  }
}

function MonitorStatusCard({ monitor }: { monitor: DashboardMonitorStatus }) {
  const navigate = useNavigate()
  const Icon = getTypeIcon(monitor.monitor_type)

  return (
    <div
      onClick={() =>
        navigate({
          to: '/monitoring/$monitorId',
          params: { monitorId: monitor.id },
        })
      }
      className={cn(
        'cursor-pointer rounded-lg border border-l-4 bg-card p-3 transition-all hover:shadow-md',
        getStatusBorderColor(monitor.current_status)
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">{monitor.friendly_name}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">{monitor.target}</p>
        </div>
        <div className={cn('h-3 w-3 rounded-full flex-shrink-0', getStatusColor(monitor.current_status))} />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {monitor.response_time ? `${Math.round(monitor.response_time)}ms` : '-'}
        </span>
        {monitor.uptime_percentage !== null && (
          <span
            className={cn(
              monitor.uptime_percentage >= 99.9
                ? 'text-green-600'
                : monitor.uptime_percentage >= 99
                  ? 'text-yellow-600'
                  : 'text-red-600'
            )}
          >
            {monitor.uptime_percentage.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}

export function DashboardStatusGridComponent({ data, isLoading }: DashboardStatusGridProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Monitor Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.monitors.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Monitor Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No monitors found. Create your first monitor!
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort: down first, then warning, then up, then paused
  const sortedMonitors = [...data.monitors].sort((a, b) => {
    const order: Record<string, number> = { down: 0, warning: 1, up: 2, paused: 3, unknown: 4 }
    return (order[a.current_status] ?? 5) - (order[b.current_status] ?? 5)
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Monitor Status</CardTitle>
          <span className="text-sm text-muted-foreground">{data.total} monitors</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedMonitors.map((monitor) => (
            <MonitorStatusCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
