/**
 * Response Chart Component
 *
 * Displays response time history using Recharts:
 * - Line chart with response times
 * - Time range selector (1h, 24h, 7d, 30d)
 * - Tooltips with timestamp and status
 * - Red dots for failed checks
 */

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricsChartResponse } from '../types'
import { cn } from '@/lib/utils'

type TimeRange = '1h' | '24h' | '7d' | '30d'

interface ResponseChartProps {
  data: MetricsChartResponse | null
  isLoading?: boolean
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
}

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
]

// Custom dot to show red for failed checks
function CustomDot(props: any) {
  const { cx, cy, payload } = props
  if (!cx || !cy) return null

  // Red dot for failed checks
  if (payload.status === 'down') {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#ef4444"
        stroke="#fff"
        strokeWidth={1}
      />
    )
  }

  return null // No dot for successful checks to keep chart clean
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
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
      <p
        className={cn(
          'mt-1',
          data.status === 'down' ? 'text-red-600' : 'text-green-600'
        )}
      >
        {data.status === 'down' ? (
          'Failed'
        ) : data.response_time ? (
          <>Response: {Math.round(data.response_time)}ms</>
        ) : (
          'No response time'
        )}
      </p>
    </div>
  )
}

export function ResponseChart({
  data,
  isLoading,
  selectedRange,
  onRangeChange,
}: ResponseChartProps) {
  // Process chart data
  const chartData = useMemo(() => {
    if (!data?.data) return []

    return data.data.map((point) => ({
      ...point,
      // Convert to number for chart, use 0 for failed checks to show them
      value: point.response_time ?? 0,
      displayTime: new Date(
        point.timestamp.endsWith('Z') ? point.timestamp : `${point.timestamp}Z`
      ),
    }))
  }, [data])

  // Format X axis based on range
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`)

    switch (selectedRange) {
      case '1h':
        return date.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
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
            <CardTitle className="text-base font-medium">Response Time</CardTitle>
            <div className="flex gap-1">
              {RANGE_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  className="h-8 w-10 animate-pulse rounded bg-muted"
                />
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
            <CardTitle className="text-base font-medium">Response Time</CardTitle>
            {data && (
              <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                {data.avg_response_time && (
                  <span>Avg: {Math.round(data.avg_response_time)}ms</span>
                )}
                {data.min_response_time && (
                  <span>Min: {Math.round(data.min_response_time)}ms</span>
                )}
                {data.max_response_time && (
                  <span>Max: {Math.round(data.max_response_time)}ms</span>
                )}
                <span
                  className={cn(
                    data.uptime_percentage >= 99.9
                      ? 'text-green-600'
                      : data.uptime_percentage >= 99
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  )}
                >
                  {data.uptime_percentage.toFixed(2)}% uptime
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
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
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
              {data?.avg_response_time && (
                <ReferenceLine
                  y={data.avg_response_time}
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
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
