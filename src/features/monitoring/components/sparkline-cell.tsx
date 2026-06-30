/**
 * Sparkline Cell Component
 *
 * Renders a response time sparkline with:
 * - P95 capping for outlier normalization
 * - Red dot overlay for "down" status checks
 * - Tooltip with detailed stats on hover
 */

import { useState, useMemo, useId } from 'react'
import { ICellRendererParams } from 'ag-grid-community'
import { Monitor, SparklinePoint } from '../types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ==================== HELPERS ====================

/**
 * Calculate percentile value from sorted array
 */
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0
  const index = Math.ceil((p / 100) * sortedArr.length) - 1
  return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))]
}

/**
 * Normalize sparkline data using P95 capping
 * - Caps outliers at 95th percentile to prevent visual squashing
 * - Returns values between 0 and 1 for SVG rendering
 */
function normalizeSparklineData(points: SparklinePoint[]): {
  normalizedValues: number[]
  p95Value: number
  minValue: number
  maxValue: number
  avgValue: number
} {
  const validValues = points
    .map((p) => p.response_time)
    .filter((v): v is number => v !== null && v > 0)

  if (validValues.length === 0) {
    return {
      normalizedValues: points.map(() => 0),
      p95Value: 0,
      minValue: 0,
      maxValue: 0,
      avgValue: 0,
    }
  }

  const sorted = [...validValues].sort((a, b) => a - b)
  const p95Value = percentile(sorted, 95)
  const minValue = sorted[0]
  const maxValue = sorted[sorted.length - 1]
  const avgValue = validValues.reduce((a, b) => a + b, 0) / validValues.length

  // Cap values at P95 and normalize to 0-1 range
  const cappedValues = points.map((p) => {
    if (p.response_time === null || p.response_time <= 0) return 0
    return Math.min(p.response_time, p95Value)
  })

  const capMin = 0
  const capMax = p95Value || 1
  const range = capMax - capMin || 1

  const normalizedValues = cappedValues.map((v) =>
    v === 0 ? 0 : (v - capMin) / range
  )

  return { normalizedValues, p95Value, minValue, maxValue, avgValue }
}

/**
 * Build SVG path for sparkline
 */
function buildSparklinePath(
  normalizedValues: number[],
  width: number,
  height: number,
  padding: number = 2
): { linePath: string; areaPath: string; points: { x: number; y: number }[] } {
  if (normalizedValues.length < 2) {
    return { linePath: '', areaPath: '', points: [] }
  }

  const chartHeight = height - padding * 2
  const chartWidth = width - padding * 2
  const stepX = chartWidth / (normalizedValues.length - 1)

  const points = normalizedValues.map((value, index) => ({
    x: padding + index * stepX,
    y: padding + chartHeight - value * chartHeight,
  }))

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  // Area path for gradient fill
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${padding} ${height - padding} Z`

  return { linePath, areaPath, points }
}

/**
 * Format timestamp for tooltip display - converts to user's local time
 */
function formatTimestamp(isoString: string): string {
  // Backend stores UTC time without 'Z' suffix, so append it to ensure proper timezone conversion
  const utcString = isoString.endsWith('Z') ? isoString : `${isoString}Z`
  const date = new Date(utcString)
  // toLocaleString converts UTC time to user's local timezone
  return date.toLocaleString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Get status color based on current monitor status
 */
function getStatusColor(status: string): { stroke: string; fill: string } {
  switch (status) {
    case 'up':
      return { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.2)' } // emerald-500
    case 'down':
      return { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)' } // red-500
    case 'paused':
      return { stroke: '#6b7280', fill: 'rgba(107, 114, 128, 0.2)' } // gray-500
    default:
      return { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.2)' } // blue-500
  }
}

// ==================== COMPONENT ====================

interface SparklineCellProps {
  params: ICellRendererParams<Monitor>
}

export function SparklineCellRenderer({ params }: SparklineCellProps) {
  const data = params.data
  const id = useId()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Dimensions
  const width = 140
  const height = 28
  const padding = 3

  // Check if we have enough data
  if (!data?.sparkline_data || data.sparkline_data.length < 2) {
    return (
      <div className="flex h-full items-center">
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    )
  }

  const points = data.sparkline_data
  const { normalizedValues, p95Value, minValue, maxValue, avgValue } =
    useMemo(() => normalizeSparklineData(points), [points])

  const { linePath, areaPath, points: svgPoints } = useMemo(
    () => buildSparklinePath(normalizedValues, width, height, padding),
    [normalizedValues, width, height]
  )

  // Get colors based on current status
  const colors = getStatusColor(data.current_status)

  // Find down status indices for red dot overlay
  const downIndices = points
    .map((p, i) => (p.status === 'down' ? i : -1))
    .filter((i) => i >= 0)

  // Tooltip content
  const tooltipContent = useMemo(() => {
    const downCount = points.filter((p) => p.status === 'down').length
    const upCount = points.length - downCount

    return (
      <div className="space-y-1.5 text-xs">
        <div className="font-medium">Response Time Trend</div>
        <div className="border-t border-border/50 pt-1.5 space-y-0.5">
          {data.sparkline_period && (
            <div className="flex justify-between gap-4">
              <span className="opacity-70">Period:</span>
              <span className="font-medium">{data.sparkline_period}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="opacity-70">Avg:</span>
            <span className="font-medium">{Math.round(avgValue)} ms</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="opacity-70">Min:</span>
            <span className="font-medium">{Math.round(minValue)} ms</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="opacity-70">Max:</span>
            <span className="font-medium">
              {Math.round(maxValue)} ms
              {maxValue > p95Value && (
                <span className="opacity-70 ml-1">(capped)</span>
              )}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="opacity-70">Checks:</span>
            <span className="font-medium">
              {upCount} up
              {downCount > 0 && (
                <span className="text-red-500 ml-1">/ {downCount} down</span>
              )}
            </span>
          </div>
        </div>
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div className="border-t border-border/50 pt-1.5">
            <div className="flex justify-between gap-4">
              <span className="opacity-70">
                {formatTimestamp(points[hoveredIndex].timestamp)}:
              </span>
              <span className="font-medium">
                {points[hoveredIndex].response_time !== null
                  ? `${Math.round(points[hoveredIndex].response_time!)} ms`
                  : 'Failed'}
                {points[hoveredIndex].status === 'down' && (
                  <span className="text-red-500 ml-1">(down)</span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }, [
    points,
    data.sparkline_period,
    avgValue,
    minValue,
    maxValue,
    p95Value,
    hoveredIndex,
  ])

  return (
    <div className="flex h-full items-center">
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <svg
              width={width}
              height={height}
              className="cursor-pointer"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const stepX = (width - padding * 2) / (points.length - 1)
                const index = Math.round((x - padding) / stepX)
                setHoveredIndex(
                  Math.max(0, Math.min(index, points.length - 1))
                )
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Gradient definition */}
              <defs>
                <linearGradient
                  id={`gradient-${id}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill={`url(#gradient-${id})`}
                  className="transition-opacity"
                />
              )}

              {/* Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors"
                />
              )}

              {/* Red dots for "down" status */}
              {downIndices.map((index) => {
                const point = svgPoints[index]
                if (!point) return null
                return (
                  <circle
                    key={`down-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={3}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={1}
                  />
                )
              })}

              {/* Hover indicator */}
              {hoveredIndex !== null && svgPoints[hoveredIndex] && (
                <>
                  <circle
                    cx={svgPoints[hoveredIndex].x}
                    cy={svgPoints[hoveredIndex].y}
                    r={4}
                    fill={
                      points[hoveredIndex].status === 'down'
                        ? '#ef4444'
                        : colors.stroke
                    }
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                  {/* Vertical line */}
                  <line
                    x1={svgPoints[hoveredIndex].x}
                    y1={padding}
                    x2={svgPoints[hoveredIndex].x}
                    y2={height - padding}
                    stroke={colors.stroke}
                    strokeWidth={1}
                    strokeOpacity={0.3}
                    strokeDasharray="2,2"
                  />
                </>
              )}
            </svg>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="w-52 bg-popover text-popover-foreground border border-border shadow-md"
          >
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
