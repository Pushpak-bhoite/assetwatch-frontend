/**
 * Dashboard Overview Stats Component
 *
 * Displays key stats at the top of the dashboard:
 * - Total monitors with status breakdown
 * - Global uptime percentage
 * - Average response time
 * - Trends (up/down arrows)
 */

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause,
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardOverviewStats } from '../../types'
import { cn } from '@/lib/utils'

interface DashboardOverviewProps {
  stats: DashboardOverviewStats | null
  isLoading?: boolean
}

export function DashboardOverview({ stats, isLoading }: DashboardOverviewProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Monitors',
      value: stats.total_monitors,
      icon: Activity,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtitle: (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle size={12} /> {stats.monitors_up} up
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <XCircle size={12} /> {stats.monitors_down} down
          </span>
          {stats.monitors_warning > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <AlertTriangle size={12} /> {stats.monitors_warning} warning
            </span>
          )}
          {stats.monitors_paused > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Pause size={12} /> {stats.monitors_paused} paused
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Global Uptime',
      value: `${stats.global_uptime_percentage.toFixed(2)}%`,
      icon: CheckCircle,
      color:
        stats.global_uptime_percentage >= 99.9
          ? 'text-green-600'
          : stats.global_uptime_percentage >= 99
            ? 'text-yellow-600'
            : 'text-red-600',
      bgColor:
        stats.global_uptime_percentage >= 99.9
          ? 'bg-green-500/10'
          : stats.global_uptime_percentage >= 99
            ? 'bg-yellow-500/10'
            : 'bg-red-500/10',
      trend: stats.uptime_trend,
      trendLabel: 'vs yesterday',
    },
    {
      title: 'Avg Response Time',
      value: stats.avg_response_time ? `${Math.round(stats.avg_response_time)}ms` : '-',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      trend: stats.response_time_trend ? -stats.response_time_trend : null, // Negative = better
      trendLabel: 'vs yesterday',
      trendUnit: 'ms',
    },
    {
      title: 'Warnings',
      value: stats.monitors_warning,
      icon: AlertTriangle,
      color: stats.monitors_warning > 0 ? 'text-yellow-600' : 'text-green-600',
      bgColor: stats.monitors_warning > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10',
      subtitle: stats.monitors_warning > 0 
        ? 'Monitor(s) need attention' 
        : 'All systems normal',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={cn('mt-2 text-3xl font-bold', card.color)}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <div className="mt-2">{card.subtitle}</div>
                )}
                {card.trend !== undefined && card.trend !== null && (
                  <div
                    className={cn(
                      'mt-2 flex items-center gap-1 text-xs',
                      card.trend > 0 ? 'text-green-600' : card.trend < 0 ? 'text-red-600' : 'text-muted-foreground'
                    )}
                  >
                    {card.trend > 0 ? (
                      <TrendingUp size={12} />
                    ) : card.trend < 0 ? (
                      <TrendingDown size={12} />
                    ) : null}
                    <span>
                      {card.trend > 0 ? '+' : ''}
                      {card.trend.toFixed(card.trendUnit === 'ms' ? 0 : 2)}
                      {card.trendUnit || ''} {card.trendLabel}
                    </span>
                  </div>
                )}
              </div>
              <div className={cn('rounded-lg p-3', card.bgColor)}>
                <card.icon className={card.color} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
