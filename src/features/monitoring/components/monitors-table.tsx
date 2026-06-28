/**
 * Monitors Table Component
 *
 * AG Grid table for displaying and managing monitors using the reusable GridTable component.
 */

import { useCallback, useRef, useState, useMemo } from 'react'
import { IServerSideGetRowsParams } from 'ag-grid-community'
import GridTable, { GridTableRef } from '@/components/custom/GridTable'
import { apiClient } from '@/lib/api-client'
import { getMonitorColumnDefs } from './monitors-columns'
import { AddMonitorDialog } from './add-monitor-dialog'
import { EditMonitorDialog } from './edit-monitor-dialog'
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
  const tableRef = useRef<GridTableRef>(null)
  const { toast } = useToast()

  // Dialog states
  const [addMonitorOpen, setAddMonitorOpen] = useState(false)
  const [editMonitorOpen, setEditMonitorOpen] = useState(false)
  const [monitorToEdit, setMonitorToEdit] = useState<Monitor | null>(null)
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
        tableRef.current?.getRef()?.api?.refreshServerSide({ purge: true })
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

  // Handler for editing monitor
  const handleEditMonitor = useCallback((monitor: Monitor) => {
    setMonitorToEdit(monitor)
    setEditMonitorOpen(true)
  }, [])

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
      tableRef.current?.getRef()?.api?.refreshServerSide({ purge: true })
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
        onEdit: handleEditMonitor,
        onDelete: handleDeleteMonitor,
      }),
    [handleToggleMonitor, handleEditMonitor, handleDeleteMonitor]
  )

  // Pagination state
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  // Server-side datasource
  const dataSource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        const { startRow, sortModel }: any = params.request
        const limit = pageSize
        const page = startRow ? Math.floor(startRow / limit) + 1 : 1

        const gridApi = tableRef.current?.getRef()?.api
        gridApi?.hideOverlay()

        try {
          // Get sort params
          const [sortInfo] = sortModel?.length
            ? sortModel
            : [{ colId: 'created_at', sort: 'desc' }]

          // Build query params
          const queryParams = new URLSearchParams({
            page: String(page),
            limit: String(limit),
            sort_by: sortInfo.colId,
            order: sortInfo.sort || 'desc',
          })

          // Add filters
          if (searchTerm) {
            queryParams.append('search', searchTerm)
          }
          if (typeFilter && typeFilter !== 'all') {
            queryParams.append('monitor_type', typeFilter)
          }
          if (statusFilter && statusFilter !== 'all') {
            queryParams.append('status', statusFilter)
          }

          const response = await apiClient.get(`/monitors?${queryParams.toString()}`)
          const { data: rowData, total } = response.data

          // Show no rows overlay if empty
          if (rowData.length === 0) {
            gridApi?.showNoRowsOverlay()
          }

          params.success({
            rowData,
            rowCount: total,
          })

          // Update stats
          fetchStats()
        } catch (error) {
          console.error('Failed to fetch monitors:', error)
          params.success({
            rowData: [],
            rowCount: 0,
          })
          gridApi?.showNoRowsOverlay()
        }
      },
    }),
    [pageSize, searchTerm, typeFilter, statusFilter, fetchStats]
  )

  // Handle pagination changes
  const handlePaginationChanged = useCallback((params: any) => {
    const newPageSize = params.api.paginationGetPageSize()
    setPageSize(newPageSize)
  }, [])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    const api = tableRef.current?.getRef()?.api
    if (api) {
      api.refreshServerSide({ purge: true })
    }
    fetchStats()
  }, [fetchStats])

  // Handle filter changes - refresh grid
  const applyFilters = useCallback(() => {
    const api = tableRef.current?.getRef()?.api
    if (api) {
      api.refreshServerSide({ purge: true })
    }
  }, [])

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
        <GridTable
          ref={tableRef}
          columnDefs={columnDefs}
          dataSource={dataSource}
          pagination={true}
          paginationPageSize={pageSize}
          cacheBlockSize={pageSize}
          onPaginationChanged={handlePaginationChanged}
          overlayNoRowsTemplate="No monitors found. Create your first monitor!"
          serverSideInitialRowCount={10}
          maxBlocksInCache={10}
          suppressHorizontalScroll={false}
        />
      </div>

      {/* Dialogs */}
      <AddMonitorDialog
        open={addMonitorOpen}
        onOpenChange={setAddMonitorOpen}
        onSuccess={() => {
          tableRef.current?.getRef()?.api?.refreshServerSide({ purge: true })
          fetchStats()
        }}
      />

      <EditMonitorDialog
        open={editMonitorOpen}
        onOpenChange={(open) => {
          setEditMonitorOpen(open)
          if (!open) setMonitorToEdit(null)
        }}
        monitor={monitorToEdit}
        onSuccess={() => {
          tableRef.current?.getRef()?.api?.refreshServerSide({ purge: true })
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
