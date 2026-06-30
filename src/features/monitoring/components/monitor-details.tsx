/**
 * Monitor Details Page Component
 *
 * Main page for viewing detailed monitor information:
 * - Header with monitor name and status
 * - KPI cards
 * - 24-hour status dots
 * - Response time chart
 * - Monitor configuration
 * - Recent incidents
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Pause, Play, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EditMonitorDialog } from './edit-monitor-dialog'
import {
  MonitorDetail,
  HourlyStatusResponse,
  MetricsChartResponse,
  MonitorIncident,
} from '../types'
import { KPICards } from './kpi-cards'
import { StatusDots } from './status-dots'
import { ResponseChart } from './response-chart'
import { IncidentsList } from './incidents-list'
import { MonitorConfigCard } from './monitor-config-card'
import { cn } from '@/lib/utils'

type TimeRange = '1h' | '24h' | '7d' | '30d'

export function MonitorDetails() {
  const { monitorId } = useParams({ from: '/_authenticated/monitoring/$monitorId' })
  const navigate = useNavigate()
  const { toast } = useToast()

  // State
  const [monitor, setMonitor] = useState<MonitorDetail | null>(null)
  const [hourlyStatus, setHourlyStatus] = useState<HourlyStatusResponse | null>(null)
  const [chartData, setChartData] = useState<MetricsChartResponse | null>(null)
  const [incidents, setIncidents] = useState<MonitorIncident[]>([])
  const [selectedRange, setSelectedRange] = useState<TimeRange>('24h')

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isChartLoading, setIsChartLoading] = useState(false)

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  // Fetch monitor details
  const fetchMonitorDetails = async () => {
    try {
      const [detailRes, hourlyRes, incidentsRes] = await Promise.all([
        apiClient.get<MonitorDetail>(`/monitors/${monitorId}/detail`),
        apiClient.get<HourlyStatusResponse>(`/monitors/${monitorId}/hourly-status`),
        apiClient.get<MonitorIncident[]>(`/monitors/${monitorId}/incidents`),
      ])

      setMonitor(detailRes.data)
      setHourlyStatus(hourlyRes.data)
      setIncidents(incidentsRes.data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to load monitor details',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch chart data
  const fetchChartData = async (range: TimeRange) => {
    setIsChartLoading(true)
    try {
      const res = await apiClient.get<MetricsChartResponse>(
        `/monitors/${monitorId}/chart?range=${range}`
      )
      setChartData(res.data)
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setIsChartLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchMonitorDetails()
    fetchChartData('24h')
  }, [monitorId])

  // Handle range change
  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range)
    fetchChartData(range)
  }

  // Handle toggle
  const handleToggle = async () => {
    if (!monitor) return

    setIsToggling(true)
    try {
      await apiClient.patch(`/monitors/${monitorId}/toggle`)
      toast({
        title: monitor.is_active ? 'Monitor paused' : 'Monitor resumed',
        description: `Monitor ${monitor.is_active ? 'paused' : 'resumed'} successfully`,
      })
      // Refresh data
      fetchMonitorDetails()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to toggle monitor',
        variant: 'destructive',
      })
    } finally {
      setIsToggling(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/monitors/${monitorId}`)
      toast({
        title: 'Monitor deleted',
        description: 'Monitor deleted successfully',
      })
      navigate({ to: '/monitoring' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to delete monitor',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // Get status badge
  const getStatusBadge = () => {
    if (!monitor) return null

    const status = monitor.is_active ? monitor.current_status : 'paused'
    const variants: Record<string, { className: string; label: string }> = {
      up: { className: 'bg-green-500', label: 'Up' },
      down: { className: 'bg-red-500', label: 'Down' },
      paused: { className: 'bg-yellow-500', label: 'Paused' },
      unknown: { className: 'bg-gray-500', label: 'Unknown' },
    }

    const variant = variants[status] || variants.unknown

    return (
      <Badge className={cn('text-white', variant.className)}>
        {variant.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center pt-4 pr-6 pb-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!monitor) {
    return (
      <div className="flex h-96 flex-col items-center justify-center pt-4 pr-6 pb-6">
        <p className="text-lg font-medium">Monitor not found</p>
        <Button
          variant="link"
          onClick={() => navigate({ to: '/monitoring' })}
          className="mt-2"
        >
          ← Back to Monitors
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4 pr-6 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/monitoring' })}
            className="mb-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Monitors
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{monitor.friendly_name}</h1>
            {getStatusBadge()}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {monitor.monitor_type.toUpperCase()} • {monitor.target}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggle}
            disabled={isToggling}
          >
            {isToggling ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : monitor.is_active ? (
              <Pause size={16} className="mr-2" />
            ) : (
              <Play size={16} className="mr-2" />
            )}
            {monitor.is_active ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil size={16} className="mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards monitor={monitor} />

      {/* 24-Hour Status */}
      {hourlyStatus && <StatusDots data={hourlyStatus} />}

      {/* Response Time Chart */}
      <ResponseChart
        data={chartData}
        isLoading={isChartLoading}
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
      />

      {/* Two Column Layout: Config + Incidents */}
      <div className="grid gap-6 md:grid-cols-2">
        <MonitorConfigCard monitor={monitor} />
        <IncidentsList incidents={incidents} />
      </div>

      {/* Edit Dialog */}
      <EditMonitorDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        monitor={monitor as any}
        onSuccess={() => {
          setEditDialogOpen(false)
          fetchMonitorDetails()
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Monitor"
        desc={`Are you sure you want to delete "${monitor.friendly_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelBtnText="Cancel"
        handleConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
