/**
 * Dashboard Page Component
 *
 * Main dashboard layout combining all dashboard widgets.
 * This is the landing page for the monitoring section.
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DashboardOverview,
  DashboardTrendChart,
  DashboardStatusGridComponent,
  DashboardActivityFeed,
  DashboardUptimeTypes,
  DashboardWarnings,
  DashboardMap,
} from './dashboard/index'
import {
  DashboardResponse,
  DashboardTrendResponse,
  DashboardStatusGrid,
} from '../types'
import { apiClient } from '@/lib/api-client'

type TimeRange = '24h' | '7d' | '30d'

export function Dashboard() {
  const [trendRange, setTrendRange] = useState<TimeRange>('24h')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch full dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
    isFetching,
  } = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardResponse>('/dashboard')
      return response.data
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Data is fresh for 30 seconds
  })

  // Fetch status grid separately
  const {
    data: gridData,
    isLoading: gridLoading,
  } = useQuery<DashboardStatusGrid>({
    queryKey: ['dashboard', 'grid'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardStatusGrid>('/dashboard/grid')
      return response.data
    },
    refetchInterval: 60000,
    staleTime: 30000,
  })

  // Fetch trend data separately when range changes
  const {
    data: trendData,
    isLoading: trendLoading,
  } = useQuery<DashboardTrendResponse>({
    queryKey: ['dashboard', 'trend', trendRange],
    queryFn: async () => {
      const response = await apiClient.get<DashboardTrendResponse>(`/dashboard/trend?range=${trendRange}`)
      return response.data
    },
    staleTime: 30000,
  })

  // Update last refresh time when data is fetched
  useEffect(() => {
    if (!isFetching) {
      setLastRefresh(new Date())
    }
  }, [isFetching])

  // Handle manual refresh
  const handleRefresh = () => {
    refetchDashboard()
  }

  // Format last refresh time
  const formatLastRefresh = () => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000)
    if (diff < 5) return 'just now'
    if (diff < 60) return `${diff}s ago`
    return `${Math.floor(diff / 60)}m ago`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your uptime at a glance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            Updated {formatLastRefresh()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCcw
              size={14}
              className={isFetching ? 'animate-spin' : ''}
            />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <DashboardOverview
        stats={dashboardData?.overview ?? null}
        isLoading={dashboardLoading}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Takes 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Response Time Trend */}
          <DashboardTrendChart
            data={trendRange === '24h' && dashboardData?.response_trend
              ? dashboardData.response_trend
              : trendData ?? null}
            isLoading={trendLoading && !dashboardData?.response_trend}
            selectedRange={trendRange}
            onRangeChange={setTrendRange}
          />

          {/* Monitor Status Grid */}
          <DashboardStatusGridComponent
            data={gridData ?? null}
            isLoading={gridLoading}
          />
        </div>

        {/* Right Column - Takes 1/3 */}
        <div className="space-y-6">
          {/* Warnings */}
          <DashboardWarnings
            data={dashboardData?.warnings ?? null}
            isLoading={dashboardLoading}
          />

          {/* Recent Activity */}
          <DashboardActivityFeed
            data={dashboardData?.recent_activity ?? null}
            isLoading={dashboardLoading}
          />

          {/* Uptime by Type */}
          <DashboardUptimeTypes
            data={dashboardData?.uptime_by_type ?? null}
            isLoading={dashboardLoading}
          />

          {/* Map Placeholder */}
          <DashboardMap
            data={dashboardData?.map_data ?? null}
            isLoading={dashboardLoading}
          />
        </div>
      </div>
    </div>
  )
}
