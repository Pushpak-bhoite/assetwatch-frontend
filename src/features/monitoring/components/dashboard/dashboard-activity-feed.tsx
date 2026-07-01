/**
 * Dashboard Activity Feed Component
 *
 * Displays recent incidents in a timeline format.
 */

import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, CheckCircle2, Clock, Globe, Activity, Server, Network } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardRecentActivity, DashboardRecentIncident } from '../../types'
import { cn } from '@/lib/utils'

interface DashboardActivityFeedProps {
  data: DashboardRecentActivity | null
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

// Format duration
function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'Ongoing'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString.endsWith('Z') ? dateString : `${dateString}Z`)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)

  if (diffSeconds < 60) return 'just now'
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`
  return `${Math.floor(diffSeconds / 86400)}d ago`
}

function IncidentItem({ incident }: { incident: DashboardRecentIncident }) {
  const navigate = useNavigate()
  const Icon = getTypeIcon(incident.monitor_type)

  return (
    <div
      onClick={() =>
        navigate({
          to: '/monitoring/$monitorId',
          params: { monitorId: incident.monitor_id },
        })
      }
      className={cn(
        'cursor-pointer rounded-lg border p-3 transition-all hover:bg-muted/50',
        incident.is_resolved ? 'border-border' : 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex-shrink-0 rounded-full p-1.5',
            incident.is_resolved ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
          )}
        >
          {incident.is_resolved ? (
            <CheckCircle2 size={14} className="text-green-600" />
          ) : (
            <AlertCircle size={14} className="text-red-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{incident.monitor_name}</span>
          </div>

          {incident.error_message && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {incident.error_message}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatRelativeTime(incident.started_at)}
            </span>
            <span
              className={cn(
                'font-medium',
                incident.is_resolved ? 'text-green-600' : 'text-red-600'
              )}
            >
              {incident.is_resolved ? 'Resolved' : 'Ongoing'} • {formatDuration(incident.duration_seconds)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardActivityFeed({ data, isLoading }: DashboardActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.incidents.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
            <CheckCircle2 size={32} className="mb-2 text-green-600" />
            <p className="font-medium">No incidents in the last 24 hours</p>
            <p className="text-sm">All systems running smoothly!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
          <div className="text-xs text-muted-foreground">
            {data.total_incidents_24h} incidents • {Math.round(data.total_downtime_minutes_24h)}min downtime
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {data.incidents.map((incident) => (
            <IncidentItem key={incident.id} incident={incident} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
