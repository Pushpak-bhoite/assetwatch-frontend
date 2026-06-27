/**
 * Monitors Table Component
 *
 * AG Grid table for displaying and managing monitors.
 */

import { useCallback, useRef, useState, useMemo } from 'react'
import {
  GetRowIdParams,
  GridReadyEvent,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  themeQuartz,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { apiClient } from '@/lib/api-client'
import { useTheme } from '@/context/theme-context'
import { getMonitorColumnDefs } from './monitors-columns'
import { AddMonitorDialog } from './add-monitor-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useToast } from '@/hooks/use-toast'
import { Monitor, MonitorStats } from '../types'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 20

export function MonitorsTable() {
  const gridRef = useRef<AgGridReact>(null)
  const { theme } = useTheme()
  const { toast } = useToast()

  // Dialog states
  const [addMonitorOpen, setAddMonitorOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [monitorToDelete, setMonitorToDelete] = useState<Monitor | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Stats
  const [stats, setStats] = useState<MonitorStats | null>(null)

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<MonitorStats>('/monitors/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  // Handler for toggling monitor
  const handleToggleMonitor = useCallback(
    async (monitor: Monitor) => {
      try {
        await apiClient.patch(`/monitors/${monitor.id}/toggle`)
        toast({
          title: monitor.is_active ? 'Monitor paused' : 'Monitor resumed',
          description: `Monitor ${monitor.is_active ? 'paused' : 'resumed'} successfully`,
        })
        gridRef.current?.api?.refreshServerSide({ purge: true })
        fetchStats()
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error?.response?.data?.detail || 'Failed to toggle monitor',
          variant: 'destructive',
        })
      }
    },
    [toast, fetchStats]
  )

  // Handler for deleting monitor
  const handleDeleteMonitor = useCallback((monitor: Monitor) => {
    setMonitorToDelete(monitor)
    setDeleteConfirmOpen(true)
  }, [])

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!monitorToDelete) return

    setIsDeleting(true)
    try {
      await apiClient.delete(`/monitors/${monitorToDelete.id}`)
      toast({
        title: 'Monitor deleted',
        description: `Successfully deleted ${monitorToDelete.friendly_name}`,
      })
      gridRef.current?.api?.refreshServerSide({ purge: true })
      fetchStats()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to delete monitor',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
      setMonitorToDelete(null)
    }
  }, [monitorToDelete, toast, fetchStats])

  // Column definitions with actions
  const columnDefs = useMemo(
    () =>
      getMonitorColumnDefs({
        onToggle: handleToggleMonitor,
        onDelete: handleDeleteMonitor,
      }),
    [handleToggleMonitor, handleDeleteMonitor]
  )

  // Server-side datasource
  const datasource: IServerSideDatasource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const { startRow, endRow, sortModel } = params.request
        const page = Math.floor((startRow || 0) / PAGE_SIZE) + 1

        try {
          const queryParams: Record<string, any> = {
            page,
            limit: PAGE_SIZE,
          }

          // Add sorting
          if (sortModel && sortModel.length > 0) {
            queryParams.sort_by = sortModel[0].colId
            queryParams.order = sortModel[0].sort
          }

          // Add filters
          if (searchTerm) {
            queryParams.search = searchTerm
          }
          if (typeFilter && typeFilter !== 'all') {
            queryParams.monitor_type = typeFilter
          }
          if (statusFilter && statusFilter !== 'all') {
            queryParams.status = statusFilter
          }

          const response = await apiClient.get('/monitors', { params: queryParams })
          const { data, total } = response.data

          params.success({
            rowData: data,
            rowCount: total,
          })

          // Update stats
          fetchStats()
        } catch (error) {
          console.error('Failed to fetch monitors:', error)
          params.fail()
        }
      },
    }),
    [searchTerm, typeFilter, statusFilter, fetchStats]
  )

  // Grid ready handler
  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      params.api.setGridOption('serverSideDatasource', datasource)
      fetchStats()
    },
    [datasource, fetchStats]
  )

  // Get row ID
  const getRowId = useCallback((params: GetRowIdParams) => params.data.id, [])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    gridRef.current?.api?.refreshServerSide({ purge: true })
    fetchStats()
  }, [fetchStats])

  // Handle filter changes - refresh grid
  const applyFilters = useCallback(() => {
    gridRef.current?.api?.refreshServerSide({ purge: true })
  }, [])

  // AG Grid theme
  const gridTheme = useMemo(
    () =>
      themeQuartz.withParams({
        backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
        foregroundColor: theme === 'dark' ? '#fafafa' : '#09090b',
        borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
        headerBackgroundColor: theme === 'dark' ? '#18181b' : '#fafafa',
        rowHoverColor: theme === 'dark' ? '#27272a' : '#f4f4f5',
        selectedRowBackgroundColor: theme === 'dark' ? '#3f3f46' : '#e4e4e7',
      }),
    [theme]
  )

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Stats Bar */}
      {stats && (
        <div className="flex gap-4 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">Up:</span>
            <span className="font-semibold text-green-600">{stats.up}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">Down:</span>
            <span className="font-semibold text-red-600">{stats.down}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-muted-foreground">Paused:</span>
            <span className="font-semibold text-yellow-600">{stats.paused}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-sm text-muted-foreground">Unknown:</span>
            <span className="font-semibold text-gray-600">{stats.unknown}</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search monitors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applyFilters()
              }
            }}
            className="w-64"
          />
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value)
              setTimeout(applyFilters, 0)
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="ping">Ping</SelectItem>
              <SelectItem value="port">Port</SelectItem>
              <SelectItem value="dns">DNS</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              setTimeout(applyFilters, 0)
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="up">Up</SelectItem>
              <SelectItem value="down">Down</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw size={16} />
          </Button>
        </div>
        <Button onClick={() => setAddMonitorOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Monitor
        </Button>
      </div>

      {/* Grid */}
      <div className="flex-1">
        <AgGridReact
          ref={gridRef}
          theme={gridTheme}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            resizable: true,
            flex: 1,
            minWidth: 100,
          }}
          rowModelType="serverSide"
          serverSideInitialRowCount={0}
          cacheBlockSize={PAGE_SIZE}
          maxBlocksInCache={10}
          getRowId={getRowId}
          onGridReady={onGridReady}
          rowSelection="single"
          suppressRowClickSelection
          animateRows
        />
      </div>

      {/* Dialogs */}
      <AddMonitorDialog
        open={addMonitorOpen}
        onOpenChange={setAddMonitorOpen}
        onSuccess={() => {
          gridRef.current?.api?.refreshServerSide({ purge: true })
          fetchStats()
        }}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Monitor"
        desc={`Are you sure you want to delete "${monitorToDelete?.friendly_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelBtnText="Cancel"
        handleConfirm={confirmDelete}
        isLoading={isDeleting}
        destructive
      />
    </div>
  )
}
