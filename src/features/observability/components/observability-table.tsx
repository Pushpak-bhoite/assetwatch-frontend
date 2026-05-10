import { useCallback, useRef, useState, useMemo } from 'react'
import {
  GetRowIdParams,
  GridReadyEvent,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  GetDetailRowDataParams,
  IDetailCellRendererParams,
  ColDef,
  themeQuartz,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { apiClient } from '@/lib/api-client'
import { useTheme } from '@/context/theme-context'
import {
  getObservabilityColumnDefs,
  getMonitorDetailColumnDefs,
} from './observability-columns'
import { AddMonitorDialog } from './add-monitor-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useToast } from '@/hooks/use-toast'
import { ObservabilityAsset, MonitorDetail } from '../types'

// Import assets action dialog for edit functionality
import { AssetsActionDialog } from '@/features/assets/components/assets-action-dialog'

const PAGE_SIZE = 20

interface AssetForDialog {
  id: string
  name: string
  asset_type: string
  description?: string
  monitor_count: number
  created_at: string
  updated_at: string
}

export function ObservabilityTable() {
  const gridRef = useRef<AgGridReact>(null)
  const { theme } = useTheme()
  const { toast } = useToast()

  // Dialog states
  const [addMonitorOpen, setAddMonitorOpen] = useState(false)
  const [selectedAssetForMonitor, setSelectedAssetForMonitor] =
    useState<ObservabilityAsset | null>(null)
  const [editAssetOpen, setEditAssetOpen] = useState(false)
  const [selectedAssetForEdit, setSelectedAssetForEdit] =
    useState<AssetForDialog | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<ObservabilityAsset | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  // Handler for adding monitor
  const handleAddMonitor = useCallback((data: ObservabilityAsset) => {
    setSelectedAssetForMonitor(data)
    setAddMonitorOpen(true)
  }, [])

  // Handler for editing asset
  const handleEditAsset = useCallback((data: ObservabilityAsset) => {
    setSelectedAssetForEdit({
      id: data.id,
      name: data.name,
      asset_type: data.asset_type,
      description: data.description ?? undefined,
      monitor_count: data.monitor_summary?.total ?? 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
    })
    setEditAssetOpen(true)
  }, [])

  // Handler for deleting asset
  const handleDeleteAsset = useCallback((data: ObservabilityAsset) => {
    setAssetToDelete(data)
    setDeleteConfirmOpen(true)
  }, [])

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!assetToDelete) return

    setIsDeleting(true)
    try {
      await apiClient.delete(`/assets/${assetToDelete.id}`)
      toast({
        title: 'Asset deleted',
        description: `Successfully deleted ${assetToDelete.name}`,
      })
      gridRef.current?.api?.refreshServerSide({ purge: true })
    } catch (error: any) {
      console.error('Delete failed:', error)
      toast({
        title: 'Error',
        description:
          error?.response?.data?.detail || 'Failed to delete asset',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
      setAssetToDelete(null)
    }
  }, [assetToDelete, toast])

  // Handler for toggling monitor active status
  const handleToggleMonitor = useCallback(
    async (monitor: MonitorDetail) => {
      try {
        await apiClient.patch(
          `/observability/monitors/${monitor.id}/toggle`,
          null,
          {
            params: { monitor_type: monitor.monitor_type },
          }
        )
        toast({
          title: monitor.is_active ? 'Monitor paused' : 'Monitor resumed',
          description: `Monitor ${monitor.is_active ? 'paused' : 'resumed'} successfully`,
        })
        // Refresh the grid
        gridRef.current?.api?.refreshServerSide({ purge: true })
      } catch (error: any) {
        console.error('Toggle failed:', error)
        toast({
          title: 'Error',
          description:
            error?.response?.data?.detail || 'Failed to toggle monitor',
          variant: 'destructive',
        })
      }
    },
    [toast]
  )

  // Handler for deleting monitor
  const handleDeleteMonitor = useCallback(
    async (monitor: MonitorDetail) => {
      try {
        // Use the asset_id from monitor data to construct endpoint
        const endpoint = `/assets/${monitor.asset_id}/monitors/${monitor.id}?monitor_type=${monitor.monitor_type}`

        await apiClient.delete(endpoint)
        toast({
          title: 'Monitor deleted',
          description: 'Monitor deleted successfully',
        })
        // Refresh the grid
        gridRef.current?.api?.refreshServerSide({ purge: true })
      } catch (error: any) {
        console.error('Delete monitor failed:', error)
        toast({
          title: 'Error',
          description:
            error?.response?.data?.detail || 'Failed to delete monitor',
          variant: 'destructive',
        })
      }
    },
    [toast]
  )

  // Column definitions
  const columnDefs = useMemo(
    () =>
      getObservabilityColumnDefs(
        handleAddMonitor,
        handleEditAsset,
        handleDeleteAsset
      ),
    [handleAddMonitor, handleEditAsset, handleDeleteAsset]
  )

  // Detail grid column definitions
  const detailColumnDefs = useMemo(
    () => getMonitorDetailColumnDefs(handleToggleMonitor, handleDeleteMonitor),
    [handleToggleMonitor, handleDeleteMonitor]
  )

  // Default column definitions
  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      suppressMovable: true,
      floatingFilter: false,
    }),
    []
  )

  // Server-side datasource
  const createDatasource = useCallback((): IServerSideDatasource => {
    return {
      getRows: async (params: IServerSideGetRowsParams) => {
        const { startRow = 0, sortModel, filterModel } = params.request

        try {
          const page = Math.floor(startRow / PAGE_SIZE) + 1

          // Build query params
          const queryParams: Record<string, any> = {
            page,
            limit: PAGE_SIZE,
          }

          // Handle sorting
          if (sortModel && sortModel.length > 0) {
            queryParams.sort_by = sortModel[0].colId
            queryParams.sort_order = sortModel[0].sort
          }

          // Handle filters
          if (filterModel) {
            Object.entries(filterModel).forEach(([field, filter]: [string, any]) => {
              if (filter.filterType === 'text' && filter.filter) {
                queryParams[`filter_${field}`] = filter.filter
              } else if (filter.filterType === 'set' && filter.values?.length > 0) {
                queryParams[`filter_${field}`] = filter.values.join(',')
              }
            })
          }

          const response = await apiClient.get('/observability/assets', {
            params: queryParams,
          })

          const { data, total } = response.data

          params.success({
            rowData: data,
            rowCount: total,
          })
        } catch (error) {
          console.error('Failed to fetch observability data:', error)
          params.fail()
        }
      },
    }
  }, [])

  // Grid ready handler
  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      const datasource = createDatasource()
      params.api.setGridOption('serverSideDatasource', datasource)
    },
    [createDatasource]
  )

  // Get row ID
  const getRowId = useCallback(
    (params: GetRowIdParams) => String(params.data.id),
    []
  )

  // Detail cell renderer params for master-detail
  const detailCellRendererParams = useCallback(
    (_params: IDetailCellRendererParams) => {
      return {
        detailGridOptions: {
          columnDefs: detailColumnDefs,
          defaultColDef: {
            sortable: true,
            resizable: true,
          },
          domLayout: 'autoHeight' as const,
          headerHeight: 32,
          rowHeight: 40,
          theme: themeQuartz.withParams({
            accentColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            foregroundColor: theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
            headerBackgroundColor: theme === 'dark' ? '#262626' : '#f5f5f5',
            oddRowBackgroundColor: theme === 'dark' ? '#1a1a1a' : '#fafafa',
            borderColor: theme === 'dark' ? '#404040' : '#e5e5e5',
          }),
        },
        getDetailRowData: async (
          detailParams: GetDetailRowDataParams<ObservabilityAsset>
        ) => {
          try {
            const response = await apiClient.get(
              `/observability/assets/${detailParams.data.id}/monitors`
            )
            detailParams.successCallback(response.data)
          } catch (error) {
            console.error('Failed to fetch monitors:', error)
            detailParams.successCallback([])
          }
        },
      }
    },
    [detailColumnDefs, theme]
  )

  // Refresh handler
  const handleRefresh = useCallback(() => {
    gridRef.current?.api?.refreshServerSide({ purge: true })
  }, [])

  // Create the theme with current mode
  const gridTheme = useMemo(
    () =>
      themeQuartz.withParams({
        accentColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff',
        foregroundColor: theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
        headerBackgroundColor: theme === 'dark' ? '#171717' : '#f5f5f5',
        oddRowBackgroundColor: theme === 'dark' ? '#0f0f0f' : '#fafafa',
        borderColor: theme === 'dark' ? '#262626' : '#e5e5e5',
      }),
    [theme]
  )

  return (
    <div className="flex h-full flex-col">
      <div style={{ flex: 1, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowModelType="serverSide"
          cacheBlockSize={PAGE_SIZE}
          maxBlocksInCache={10}
          pagination={true}
          paginationPageSize={PAGE_SIZE}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          onGridReady={onGridReady}
          getRowId={getRowId}
          rowSelection={{ mode: 'singleRow', enableClickSelection: false }}
          enableCellTextSelection={true}
          animateRows={false}
          theme={gridTheme}
          tooltipShowDelay={500}
          tooltipHideDelay={10000}
          // Master-detail configuration
          masterDetail={true}
          detailCellRendererParams={detailCellRendererParams}
          detailRowHeight={200}
          detailRowAutoHeight={true}
        />
      </div>

      {/* Add Monitor Dialog */}
      <AddMonitorDialog
        open={addMonitorOpen}
        onOpenChange={setAddMonitorOpen}
        asset={selectedAssetForMonitor}
        onSuccess={handleRefresh}
      />

      {/* Edit Asset Dialog */}
      <AssetsActionDialog
        key={`edit-${selectedAssetForEdit?.id}`}
        open={editAssetOpen}
        onOpenChange={setEditAssetOpen}
        currentRow={selectedAssetForEdit}
        onSuccess={handleRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Asset"
        desc={`Are you sure you want to delete "${assetToDelete?.name}"? This action cannot be undone and will also delete all associated monitors.`}
        confirmText="Delete"
        handleConfirm={confirmDelete}
        isLoading={isDeleting}
        destructive
      />
    </div>
  )
}

export default ObservabilityTable
