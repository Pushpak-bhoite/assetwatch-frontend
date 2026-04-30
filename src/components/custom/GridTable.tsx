/**
 * GridTable - Reusable AG Grid Component
 *
 * A flexible, reusable AG Grid wrapper component that supports both
 * server-side and client-side data modes with theming support.
 *
 * Features:
 * - Server-side row model support
 * - Client-side row model support
 * - Theme synchronization (light/dark)
 * - Built-in pagination
 * - Column state persistence support
 * - Customizable via props
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react'

import {
  colorSchemeDarkBlue,
  colorSchemeLightWarm,
  themeQuartz,
  GridReadyEvent,
  ColDef,
  IServerSideDatasource,
} from 'ag-grid-community'

import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import { useTheme } from '@/context/theme-context'

// ==================== TYPES ====================

export interface GridTableRef {
  /** Get the AG Grid ref */
  getRef: () => AgGridReact | null
  /** Get the wrapper ref */
  getWrapperRef: () => { getRef: () => { current: AgGridReact | null } } | null
  /** Get the wrapper DOM element */
  getWrapperElement: () => HTMLDivElement | null
}

export interface GridTableProps extends Omit<AgGridReactProps, 'theme'> {
  /** Server-side datasource for fetching data */
  dataSource?: IServerSideDatasource
  /** Column definitions */
  columnDefs: ColDef[]
  /** Row selection mode: 'singleRow' | 'multiRow' */
  rowSelection?: 'singleRow' | 'multiRow'
  /** Client-side row data (use this for client-side mode) */
  rowData?: any[]
  /** Ref to store grid APIs by grid ID */
  gridApisRef?: React.MutableRefObject<Record<string, any>>
  /** Key for persisting column state */
  gridColumnStateKey?: string
  /** Custom overlay template when no rows */
  overlayNoRowsTemplate?: string
  /** Callback when pagination changes */
  onPaginationChanged?: (params: any) => void
  /** Enable row click selection */
  enableRowClickSelection?: boolean
  /** Custom style for the wrapper div */
  style?: React.CSSProperties
  /** DOM layout mode */
  domLayout?: 'normal' | 'autoHeight' | 'print'
  /** External callback on grid ready */
  onGridReadyExternal?: (params: GridReadyEvent) => void
  /** Enable checkboxes for row selection */
  rowSelectionCheckboxes?: boolean
}

// ==================== COMPONENT ====================

const GridTable = forwardRef<GridTableRef, GridTableProps>(function GridTable(
  {
    dataSource,
    columnDefs,
    rowSelection,
    overlayNoRowsTemplate,
    onPaginationChanged,
    enableRowClickSelection,
    rowData,
    style,
    domLayout,
    onGridReadyExternal,
    gridApisRef,
    rowSelectionCheckboxes,
    ...props
  },
  ref
) {
  const { theme } = useTheme()
  const gridRef = useRef<AgGridReact>(null)
  const wrapperRef = useRef<any>(null)
  const wrapperDivRef = useRef<HTMLDivElement>(null)
  const onGridReadyExternalRef = useRef(onGridReadyExternal)

  // Keep external callback ref updated
  useEffect(() => {
    onGridReadyExternalRef.current = onGridReadyExternal
  }, [onGridReadyExternal])

  // Determine effective theme mode (handle 'system' theme)
  const effectiveMode = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return theme
  }, [theme])

  // Memoize AG Grid theme based on effective mode
  const agTheme = useMemo(() => {
    if (effectiveMode === 'light') {
      return themeQuartz.withPart(colorSchemeLightWarm)
    }
    return themeQuartz.withPart(colorSchemeDarkBlue)
  }, [effectiveMode])

  // Memoize pagination page size selector options
  const paginationPageSizeSelector = useMemo<number[]>(() => {
    return [10, 20, 50, 100]
  }, [])

  // Memoize default column definition
  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      flex: 1,
      sortable: true,
      cellStyle: { cursor: 'pointer' },
    }),
    []
  )

  // Memoize row selection config
  const rowSelectionConfig = useMemo(
    () =>
      rowSelection
        ? {
            mode: rowSelection,
            enableClickSelection: enableRowClickSelection ?? false,
            enableSelectionWithoutKeys: true,
            checkboxes: rowSelectionCheckboxes ?? false,
          }
        : undefined,
    [rowSelection, enableRowClickSelection, rowSelectionCheckboxes]
  )

  // Memoize getRowId function - assumes data has 'id' field
  const getRowId = useCallback((params: any) => params.data?.id, [])

  // Memoize getMainMenuItems - removes pin submenu
  const getMainMenuItems = useCallback((params: any) => {
    return params.defaultItems.filter((item: string) => item !== 'pinSubMenu')
  }, [])

  // Handle grid ready event
  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      // Set server-side datasource if provided
      if (dataSource) {
        params.api.setGridOption('serverSideDatasource', dataSource)
      }

      // Call external callback if provided
      if (onGridReadyExternalRef.current) {
        onGridReadyExternalRef.current(params)
      }

      // Store API reference if gridApisRef provided
      if (gridApisRef) {
        const id = params.api.getGridId()
        gridApisRef.current[id] = params.api
      }
    },
    [dataSource, gridApisRef]
  )

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      getRef: () => gridRef.current,
      getWrapperRef: () => wrapperRef.current,
      getWrapperElement: () => wrapperDivRef.current,
    }),
    []
  )

  // Update wrapperRef for compatibility
  useEffect(() => {
    wrapperRef.current = {
      getRef: () => ({ current: gridRef.current }),
    }
  }, [])

  // Common grid props shared between server-side and client-side modes
  const commonGridProps: Partial<AgGridReactProps> = {
    defaultColDef,
    ref: gridRef,
    getRowId,
    columnDefs,
    theme: agTheme,
    rowSelection: rowSelectionConfig as any,
    popupParent:
      props.popupParent ||
      wrapperDivRef.current ||
      document.getElementById('ag-grid-popup-parent-main-table'),
    onGridReady,
    suppressCellFocus: true,
    suppressDragLeaveHidesColumns: true,
    suppressMoveWhenRowDragging: true,
    paginationPageSizeSelector,
    getMainMenuItems,
    overlayNoRowsTemplate:
      overlayNoRowsTemplate ?? 'No data available',
    onPaginationChanged,
    suppressContextMenu: true,
    // Built-in tooltip settings
    tooltipMouseTrack: true,
    tooltipShowDelay: 0,
    tooltipShowMode: 'whenTruncated',
    maintainColumnOrder: true,
    ...props,
  }

  // Determine if using server-side mode
  const isServerSideMode = !rowData && dataSource

  return (
    <div
      id='ag-grid-popup-parent-main-table'
      ref={wrapperDivRef}
      className={`w-full h-full ag-theme-quartz ${effectiveMode}-mode relative`}
      style={style}
    >
      {isServerSideMode ? (
        // Server-side row model
        <AgGridReact
          rowModelType='serverSide'
          domLayout={domLayout ?? 'autoHeight'}
          suppressServerSideFullWidthLoadingRow={true}
          pagination={true}
          paginationPageSize={10}
          cacheBlockSize={10}
          {...commonGridProps}
        />
      ) : (
        // Client-side row model
        <AgGridReact
          domLayout={domLayout ?? 'autoHeight'}
          rowData={rowData ?? []}
          pagination={true}
          paginationPageSize={10}
          {...commonGridProps}
        />
      )}
    </div>
  )
})

export default React.memo(GridTable)
