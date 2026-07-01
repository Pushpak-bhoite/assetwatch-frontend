/**
 * Dashboard Trend Chart Component
 *
 * Displays aggregated response time trend using Recharts.
 * Shows data across all monitors with time range selector.
 */

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardTrendResponse } from '../../types'
import { cn } from '@/lib/utils'

type TimeRange = '24h' | '7d' | '30d'

interface DashboardTrendChartProps {
  data: DashboardTrendResponse | null
  isLoading?: boolean
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
}

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
]

// Custom tooltip
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const date = new Date(data.timestamp.endsWith('Z') ? data.timestamp : `${data.timestamp}Z`)

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">
        {date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}
      </p>
      <div className="mt-1 space-y-0.5 text-xs">
        {data.avg_response_time !== null && (
          <p>Avg: {Math.round(data.avg_response_time)}ms</p>
        )}
        <p>
          Checks: {data.total_checks - data.failed_checks}/{data.total_checks} passed
        </p>
        {data.failed_checks > 0 && (
          <p className="text-red-600">{data.failed_checks} failed</p>
        )}
      </div>
    </div>
  )
}

export function DashboardTrendChart({
  data,
  isLoading,
  selectedRange,
  onRangeChange,
}: DashboardTrendChartProps) {
  // Process chart data
  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.map((point) => ({
      ...point,
      value: point.avg_response_time ?? 0,
    }))
  }, [data])

  // Format X axis based on range
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`)

    switch (selectedRange) {
      case '24h':
        return date.toLocaleTimeString(undefined, {
          hour: 'numeric',
          hour12: true,
        })
      case '7d':
        return date.toLocaleDateString(undefined, {
          weekday: 'short',
        })
      case '30d':
        return date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
      default:
        return ''
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Response Time Trend</CardTitle>
            <div className="flex gap-1">
              {RANGE_OPTIONS.map((opt) => (
                <div key={opt.value} className="h-8 w-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Response Time Trend</CardTitle>
            {data && (
              <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                {data.overall_avg && (
                  <span>Avg: {Math.round(data.overall_avg)}ms</span>
                )}
                <span
                  className={cn(
                    data.overall_uptime >= 99.9
                      ? 'text-green-600'
                      : data.overall_uptime >= 99
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  )}
                >
                  {data.overall_uptime.toFixed(2)}% uptime
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={selectedRange === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onRangeChange(opt.value)}
                className="h-8 px-3"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No data available for this time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickFormatter={(value) => `${value}ms`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              {data?.overall_avg && (
                <ReferenceLine
                  y={data.overall_avg}
                  stroke="#6b7280"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Avg',
                    position: 'right',
                    fontSize: 10,
                    fill: '#6b7280',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
