/**
 * Status Dots Component
 *
 * Displays 24-hour status overview with:
 * - 24 dots representing each hour
 * - Green = all up, Red = all down, Yellow = partial
 * - Tooltip with hour details
 * - Summary of incidents and downtime
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HourlyStatusResponse, HourlyStatusPoint } from '../types'
import { cn } from '@/lib/utils'

interface StatusDotsProps {
  data: HourlyStatusResponse
  isLoading?: boolean
}

export function StatusDots({ data, isLoading }: StatusDotsProps) {
  // Get status color class
  const getStatusColor = (status: HourlyStatusPoint['status']): string => {
    switch (status) {
      case 'up':
        return 'bg-green-500'
      case 'down':
        return 'bg-red-500'
      case 'partial':
        return 'bg-yellow-500'
      case 'no_data':
      default:
        return 'bg-gray-300 dark:bg-gray-600'
    }
  }

  // Format hour for display
  const formatHour = (timestamp: string, hour: number): string => {
    const date = new Date(timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`)
    return date.toLocaleString(undefined, {
      hour: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric',
    })
  }

  // Format downtime
  const formatDowntime = (minutes: number): string => {
    if (minutes === 0) return 'No downtime'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">24-Hour Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-3 animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">24-Hour Status</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {data.total_incidents > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {data.total_incidents} incident{data.total_incidents !== 1 ? 's' : ''}
              </span>
            )}
            <span>{formatDowntime(data.total_downtime_minutes)} downtime</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex gap-1">
            {data.hours.map((hour, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'h-8 w-3 cursor-pointer rounded-sm transition-all hover:scale-110',
                      getStatusColor(hour.status)
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground border border-border shadow-md">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium">
                      {formatHour(hour.timestamp, hour.hour)}
                    </p>
                    <p>
                      Status:{' '}
                      <span
                        className={cn(
                          'font-medium',
                          hour.status === 'up' && 'text-green-600',
                          hour.status === 'down' && 'text-red-600',
                          hour.status === 'partial' && 'text-yellow-600'
                        )}
                      >
                        {hour.status === 'no_data'
                          ? 'No data'
                          : hour.status.charAt(0).toUpperCase() + hour.status.slice(1)}
                      </span>
                    </p>
                    {hour.total_checks > 0 && (
                      <>
                        <p>Uptime: {hour.uptime_percentage.toFixed(1)}%</p>
                        <p>
                          Checks: {hour.total_checks - hour.failed_checks}/
                          {hour.total_checks} passed
                        </p>
                      </>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Up</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>Down</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>No data</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
