/**
 * Incidents List Component
 *
 * Displays recent downtime incidents:
 * - Start/end time
 * - Duration
 * - Error message
 * - Number of failed checks
 */

import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonitorIncident } from '../types'
import { cn } from '@/lib/utils'

interface IncidentsListProps {
  incidents: MonitorIncident[]
  isLoading?: boolean
}

export function IncidentsList({ incidents, isLoading }: IncidentsListProps) {
  // Format duration
  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return 'Ongoing'
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  // Format timestamp
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Calculate how long ago
  const timeAgo = (dateStr: string): string => {
    const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Recent Incidents</CardTitle>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="mb-2 h-10 w-10 text-green-500" />
            <p className="font-medium text-green-700 dark:text-green-300">
              No incidents recorded
            </p>
            <p className="text-sm text-muted-foreground">
              Your monitor has been running smoothly
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className={cn(
                  'rounded-lg border p-3',
                  !incident.is_resolved
                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
                    : 'border-border bg-muted/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={16}
                      className={cn(
                        'mt-0.5',
                        !incident.is_resolved
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-orange-500'
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          'text-sm font-medium',
                          !incident.is_resolved && 'text-red-700 dark:text-red-300'
                        )}
                      >
                        {!incident.is_resolved ? 'Ongoing Incident' : 'Resolved'}
                      </p>
                      {incident.error_message && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {incident.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(incident.started_at)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Started: {formatTime(incident.started_at)}</span>
                  </div>
                  {incident.ended_at && (
                    <div className="flex items-center gap-1">
                      <CheckCircle size={12} />
                      <span>Ended: {formatTime(incident.ended_at)}</span>
                    </div>
                  )}
                  <span>Duration: {formatDuration(incident.duration_seconds)}</span>
                  <span>{incident.check_count} failed checks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
