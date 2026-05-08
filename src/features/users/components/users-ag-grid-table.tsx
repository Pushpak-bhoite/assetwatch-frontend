/**
 * Users AG Grid Table
 *
 * Server-side paginated users table using AG Grid.
 * Fetches data from the backend API with pagination, sorting, and filtering.
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { IServerSideGetRowsParams, IServerSideGetRowsRequest } from 'ag-grid-community'
import GridTable, { GridTableRef } from '@/components/custom/GridTable'
import { getUsersColumnDefs } from './users-ag-grid-columns'
import apiClient from '@/lib/api-client'

// ==================== TYPES ====================

interface UserListResponse {
  data: any[]
  total: number
  page: number
  limit: number
  total_pages: number
}

interface UsersAgGridTableProps {
  /** Callback when a row is clicked */
  onRowClicked?: (data: any) => void
  /** Callback when edit action is clicked */
  onEdit?: (data: any) => void
  /** Callback when delete action is clicked */
  onDelete?: (data: any) => void
  /** Callback when a toggle field changes (status/verified) */
  onToggle?: (userId: string, field: string, newValue: boolean) => Promise<void>
  /** Callback when selection changes */
  onSelectionChanged?: (selectedRows: any[]) => void
  /** Enable row selection */
  rowSelection?: 'singleRow' | 'multiRow'
  /** Custom class name */
  className?: string
}

// ==================== COMPONENT ====================

export function UsersAgGridTable({
  onRowClicked,
  onEdit,
  onDelete,
  onToggle,
  onSelectionChanged,
  rowSelection,
  className,
}: UsersAgGridTableProps) {
  const tableRef = useRef<GridTableRef>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Get column definitions with action handlers
  const columnDefs = useMemo(
    () => getUsersColumnDefs(onEdit, onDelete, onToggle),
    [onEdit, onDelete, onToggle]
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
            : [{ colId: 'name', sort: 'asc' }]

          // Build query parameters
          const queryParams = new URLSearchParams({
            page: String(page),
            limit: String(limit),
            sort_by: sortInfo.colId,
            order: sortInfo.sort || 'asc',
          })

          // Handle text search from name filter
          if (filterModel?.name?.filter) {
            queryParams.append('search', filterModel.name.filter)
          }

          // Handle organization_type filter
          if (filterModel?.organization_type?.values?.length) {
            queryParams.append(
              'organization_type',
              filterModel.organization_type.values[0]
            )
          }

          // Handle is_active filter
          if (filterModel?.is_active?.values?.length === 1) {
            queryParams.append(
              'is_active',
              String(filterModel.is_active.values[0])
            )
          }

          // Fetch data from API
          const response = await apiClient.get<UserListResponse>(
            `/users/list?${queryParams.toString()}`
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

          setCurrentPage(page)
        } catch (err: any) {
          console.error('Failed to fetch users:', err)
          setError(err.message || 'Failed to fetch users')

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
   * Handle row click
   */
  const handleRowClicked = useCallback(
    (event: any) => {
      if (onRowClicked && event.data) {
        onRowClicked(event.data)
      }
    },
    [onRowClicked]
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

  // Expose refresh method for parent components
  useEffect(() => {
    // You can attach refreshData to a global event or context if needed
  }, [refreshData])

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
          error ? 'Failed to load users' : 'No users found'
        }
        // Server-side specific settings
        serverSideInitialRowCount={10}
        maxBlocksInCache={10}
        // Disable horizontal scroll for cleaner look
        suppressHorizontalScroll={false}
      />
    </div>
  )
}

export default UsersAgGridTable
