/**
 * Assets AG Grid Table
 *
 * Server-side paginated assets table using AG Grid.
 * Fetches data from the backend API with pagination, sorting, and filtering.
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { IServerSideGetRowsParams } from 'ag-grid-community'
import GridTable, { GridTableRef } from '@/components/custom/GridTable'
import { getAssetsColumnDefs, allAssetTypes } from './assets-ag-grid-columns'
import apiClient from '@/lib/api-client'

// ==================== TYPES ====================

interface AssetListResponse {
  data: any[]
  total: number
  page: number
  limit: number
  total_pages: number
}

interface AssetsAgGridTableProps {
  /** Callback when edit action is clicked */
  onEdit?: (data: any) => void
  /** Callback when delete action is clicked */
  onDelete?: (data: any) => void
  /** Callback when selection changes */
  onSelectionChanged?: (selectedRows: any[]) => void
  /** Enable row selection */
  rowSelection?: 'singleRow' | 'multiRow'
  /** Custom class name */
  className?: string
}

// ==================== COMPONENT ====================

export function AssetsAgGridTable({
  onEdit,
  onDelete,
  onSelectionChanged,
  rowSelection,
  className,
}: AssetsAgGridTableProps) {
  const tableRef = useRef<GridTableRef>(null)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store pagination state
  const [pageSize, setPageSize] = useState(10)

  // Get column definitions with action handlers
  const columnDefs = useMemo(
    () => getAssetsColumnDefs(onEdit, onDelete),
    [onEdit, onDelete]
  )

  /**
   * Server-side datasource for AG Grid
   * Handles fetching data with pagination, sorting, and filtering
   */
  const dataSource = useMemo(
    () => ({
      getRows: async (params: IServerSideGetRowsParams) => {
        setIsLoading(true)
        setError(null)

        const gridApi = tableRef.current?.getRef()?.api
        gridApi?.hideOverlay()

        try {
          const { request } = params
          const { startRow, sortModel, filterModel }:any = request

          // Calculate page from startRow
          const limit = pageSize
          const page = startRow ? Math.floor(startRow / limit) + 1 : 1

          // Get sort parameters
          const [sortInfo] = sortModel?.length
            ? sortModel
            : [{ colId: 'created_at', sort: 'desc' }]

          // Build query parameters
          const queryParams = new URLSearchParams({
            page: String(page),
            limit: String(limit),
            sort_by: sortInfo.colId,
            order: sortInfo.sort || 'desc',
          })

          // Handle text search from name filter
          if (filterModel?.name?.filter) {
            queryParams.append('search', filterModel.name.filter)
          }

          // Handle asset_type filter
          if (filterModel?.asset_type?.values?.length) {
            // AG Grid set filter returns array, we take first one for now
            // Could be extended to support multiple values
            queryParams.append('asset_type', filterModel.asset_type.values[0])
          }

          // Fetch data from API
          const response = await apiClient.get<AssetListResponse>(
            `/assets/?${queryParams.toString()}`
          )

          const { data: rowData, total } = response.data

          // Show no rows overlay if empty
          if (rowData.length === 0) {
            gridApi?.showNoRowsOverlay()
          }

          // Success callback with data
          params.success({
            rowData,
            rowCount: total,
          })
        } catch (err: any) {
          console.error('Failed to fetch assets:', err)
          setError(err.message || 'Failed to fetch assets')

          // Show empty state on error
          params.success({
            rowData: [],
            rowCount: 0,
          })

          gridApi?.showNoRowsOverlay()
        } finally {
          setIsLoading(false)
        }
      },
    }),
    [pageSize]
  )

  /**
   * Handle pagination changes
   */
  const handlePaginationChanged = useCallback((params: any) => {
    const newPageSize = params.api.paginationGetPageSize()
    setPageSize(newPageSize)
  }, [])

  /**
   * Handle row click - navigate to asset details
   */
  const handleRowClicked = useCallback(
    (event: any) => {
      // Don't navigate if clicking on actions column
      const focusedCell = event.api.getFocusedCell()
      if (focusedCell?.column?.getColId() === 'actions') {
        return
      }

      if (event.data?.id) {
        navigate({ to: '/assets/$assetId', params: { assetId: event.data.id } })
      }
    },
    [navigate]
  )

  /**
   * Handle selection change
   */
  const handleSelectionChanged = useCallback(
    (event: any) => {
      if (onSelectionChanged) {
        const selectedNodes = event.api.getSelectedNodes()
        const selectedData = selectedNodes.map((node: any) => node.data)
        onSelectionChanged(selectedData)
      }
    },
    [onSelectionChanged]
  )

  /**
   * Refresh the grid data
   */
  const refreshData = useCallback(() => {
    const api = tableRef.current?.getRef()?.api
    if (api) {
      api.refreshServerSide({ purge: true })
    }
  }, [])

  return (
    <div className={className}>
      {error && (
        <div className='mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
          {error}
          <button
            onClick={refreshData}
            className='ml-2 underline hover:no-underline'
          >
            Retry
          </button>
        </div>
      )}

      <GridTable
        ref={tableRef}
        columnDefs={columnDefs}
        dataSource={dataSource}
        rowSelection={rowSelection}
        pagination={true}
        paginationPageSize={pageSize}
        cacheBlockSize={pageSize}
        onPaginationChanged={handlePaginationChanged}
        onRowClicked={handleRowClicked}
        onSelectionChanged={handleSelectionChanged}
        overlayNoRowsTemplate={
          error ? 'Failed to load assets' : 'No assets found. Create your first asset!'
        }
        // Server-side specific settings
        serverSideInitialRowCount={10}
        maxBlocksInCache={10}
        suppressHorizontalScroll={false}
      />
    </div>
  )
}

export default AssetsAgGridTable
