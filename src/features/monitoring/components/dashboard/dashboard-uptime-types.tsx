/**
 * Dashboard Uptime by Type Component
 *
 * Shows uptime statistics broken down by monitor type (HTTP, Ping, etc.)
 */

import { Globe, Activity, Server, Network } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardUptimeByTypeResponse, DashboardUptimeByType } from '../../types'
import { cn } from '@/lib/utils'

interface DashboardUptimeTypesProps {
  data: DashboardUptimeByTypeResponse | null
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

// Get display name for type
function getTypeName(type: string): string {
  switch (type) {
    case 'http':
      return 'HTTP/HTTPS'
    case 'ping':
      return 'Ping'
    case 'port':
      return 'Port'
    case 'dns':
      return 'DNS'
    default:
      return type.toUpperCase()
  }
}

function TypeCard({ item }: { item: DashboardUptimeByType }) {
  const Icon = getTypeIcon(item.monitor_type)

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-muted p-2">
          <Icon size={18} className="text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{getTypeName(item.monitor_type)}</p>
          <p className="text-xs text-muted-foreground">
            {item.count} {item.count === 1 ? 'monitor' : 'monitors'}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={cn(
            'font-medium',
            item.uptime_percentage >= 99.9
              ? 'text-green-600'
              : item.uptime_percentage >= 99
                ? 'text-yellow-600'
                : 'text-red-600'
          )}
        >
          {item.uptime_percentage.toFixed(2)}%
        </p>
        {item.avg_response_time !== null && (
          <p className="text-xs text-muted-foreground">
            {Math.round(item.avg_response_time)}ms avg
          </p>
        )}
      </div>
    </div>
  )
}

export function DashboardUptimeTypes({ data, isLoading }: DashboardUptimeTypesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Uptime by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.types.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Uptime by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort by count descending
  const sortedTypes = [...data.types].sort((a, b) => b.count - a.count)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Uptime by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedTypes.map((item) => (
            <TypeCard key={item.monitor_type} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
