/**
 * Dashboard Warnings Component
 *
 * Displays active warnings that need attention.
 */

import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardWarningsResponse, DashboardWarning } from '../../types'
import { cn } from '@/lib/utils'

interface DashboardWarningsProps {
  data: DashboardWarningsResponse | null
  isLoading?: boolean
}

// Get severity badge variant
function getSeverityVariant(severity: string) {
  switch (severity) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'outline'
    default:
      return 'secondary'
  }
}

// Get severity color
function getSeverityColor(severity: string) {
  switch (severity) {
    case 'high':
      return 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20'
    case 'medium':
      return 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800/50 dark:bg-yellow-950/20'
    default:
      return 'border-border'
  }
}

// Get warning type label
function getWarningTypeLabel(type: string): string {
  switch (type) {
    case 'slow_response':
      return 'Slow Response'
    case 'high_error_rate':
      return 'High Error Rate'
    case 'ssl_expiring':
      return 'SSL Expiring'
    default:
      return type.replace(/_/g, ' ')
  }
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

function WarningItem({ warning }: { warning: DashboardWarning }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() =>
        navigate({
          to: '/monitoring/$monitorId',
          params: { monitorId: warning.monitor_id },
        })
      }
      className={cn(
        'cursor-pointer rounded-lg border p-3 transition-all hover:bg-muted/50',
        getSeverityColor(warning.severity)
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={18}
          className={cn(
            'mt-0.5 flex-shrink-0',
            warning.severity === 'high'
              ? 'text-red-600'
              : warning.severity === 'medium'
                ? 'text-yellow-600'
                : 'text-muted-foreground'
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{warning.monitor_name}</span>
            <Badge variant={getSeverityVariant(warning.severity)} className="text-xs">
              {getWarningTypeLabel(warning.warning_type)}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {warning.message}
          </p>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} />
            {formatRelativeTime(warning.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardWarnings({ data, isLoading }: DashboardWarningsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Warnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.warnings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Warnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 flex-col items-center justify-center text-center text-muted-foreground">
            <CheckCircle2 size={28} className="mb-2 text-green-600" />
            <p className="text-sm font-medium">No warnings</p>
            <p className="text-xs">All monitors performing well</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort by severity: high, medium, low
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const sortedWarnings = [...data.warnings].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Warnings</CardTitle>
          <Badge variant="outline" className="text-xs">
            {data.total} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {sortedWarnings.map((warning) => (
            <WarningItem key={warning.id} warning={warning} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
