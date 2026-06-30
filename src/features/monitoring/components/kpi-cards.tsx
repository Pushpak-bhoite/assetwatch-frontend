/**
 * KPI Cards Component
 *
 * Displays key metrics for a monitor:
 * - Current Response Time
 * - Uptime Percentage (30 days)
 * - Last Checked
 * - Check Interval
 * - Average Response Time
 */

import { Clock, Activity, Timer, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { MonitorDetail } from '../types'
import { cn } from '@/lib/utils'

interface KPICardsProps {
  monitor: MonitorDetail
}

export function KPICards({ monitor }: KPICardsProps) {
  // Format last checked time
  const formatLastChecked = (dateStr: string | null): string => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`)
    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSeconds < 60) return `${diffSeconds} sec ago`
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hr ago`
    return `${Math.floor(diffSeconds / 86400)} days ago`
  }

  // Format interval for display
  const formatInterval = (interval: string): string => {
    const labels: Record<string, string> = {
      '30s': '30 sec',
      '1m': '1 min',
      '5m': '5 min',
      '15m': '15 min',
      '30m': '30 min',
      '1hr': '1 hour',
      '12hr': '12 hours',
    }
    return labels[interval] || interval
  }

  // KPI data
  const kpis = [
    {
      label: 'Current Response',
      value: monitor.response_time ? `${Math.round(monitor.response_time)} ms` : '-',
      icon: Timer,
      trend:
        monitor.avg_response_time_30d && monitor.response_time
          ? monitor.response_time < monitor.avg_response_time_30d
            ? 'down'
            : 'up'
          : null,
      trendValue:
        monitor.avg_response_time_30d && monitor.response_time
          ? Math.abs(
              Math.round(monitor.response_time - monitor.avg_response_time_30d)
            )
          : null,
    },
    {
      label: 'Uptime (30d)',
      value: `${monitor.uptime_percentage_30d.toFixed(2)}%`,
      icon: Activity,
      status:
        monitor.uptime_percentage_30d >= 99.9
          ? 'good'
          : monitor.uptime_percentage_30d >= 99
            ? 'warning'
            : 'bad',
    },
    {
      label: 'Last Checked',
      value: formatLastChecked(monitor.last_check_at),
      icon: Clock,
    },
    {
      label: 'Interval',
      value: formatInterval(monitor.check_interval),
      icon: TrendingUp,
    },
  
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {kpis.map((kpi, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p
                  className={cn(
                    'mt-1 text-2xl font-bold',
                    kpi.status === 'good' && 'text-green-600 dark:text-green-400',
                    kpi.status === 'warning' &&
                      'text-yellow-600 dark:text-yellow-400',
                    kpi.status === 'bad' && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {kpi.value}
                </p>
                {kpi.trend && kpi.trendValue !== null && (
                  <p
                    className={cn(
                      'mt-1 text-xs',
                      kpi.trend === 'down'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    )}
                  >
                    {kpi.trend === 'down' ? '↓' : '↑'} {kpi.trendValue}ms vs avg
                  </p>
                )}
              </div>
              <kpi.icon
                size={20}
                className="text-muted-foreground opacity-50"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Error Card - Show if monitor is down or has recent error */}
      {(monitor.current_status === 'down' ) && (
        <Card className="col-span-2 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20 md:col-span-3 lg:col-span-5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 text-red-600 dark:text-red-400" size={20} />
              <div className="flex-1">
                <p className="font-medium text-red-700 dark:text-red-300">
                  {monitor.current_status === 'down'
                    ? `Down - ${monitor.consecutive_failures} consecutive failures`
                    : 'Last Error'}
                </p>
                {monitor.last_error && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {monitor.last_error}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
