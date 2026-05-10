/**
 * Observability Column Definitions
 *
 * AG Grid column configuration for the observability table.
 * Uses React components for cell renderers (required for AG Grid v33+ with React).
 */

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { MonitorSummary } from '../types'
import {
  Activity,
  CheckCircle,
  Edit,
  Pause,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'

/**
 * Get display value helper - returns '-' for null/undefined/empty values
 */
const getDisplayValue = (params: any): string => {
  const value = params.value ?? params.data?.[params.colDef?.field]
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

/**
 * Format asset type for display - shows full descriptive type
 * e.g., "Circuit-Internet-Fiber Broadband" -> "Circuit - Internet - Fiber Broadband"
 */
const formatAssetType = (params: any): string => {
  const value = params.value
  if (!value) return '-'
  // Replace hyphens with spaced hyphens for better readability
  return value.replace(/-/g, ' - ')
}

/**
 * Format date value for display
 */
const formatDate = (params: any): string => {
  const value = params.value
  if (!value) return 'Never'
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

// ==================== REACT CELL RENDERERS ====================

interface MonitorsCellProps {
  params: ICellRendererParams
  onAddMonitor?: (data: any) => void
}

function MonitorsCellRenderer({ params, onAddMonitor }: MonitorsCellProps) {
  const summary: MonitorSummary = params.value

  if (!summary || summary.total === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <button
          className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/20"
          onClick={(e) => {
            e.stopPropagation()
            onAddMonitor?.(params.data)
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center gap-2">
      {summary.performance_count > 0 && (
        <span
          className="flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-xs text-blue-600 dark:text-blue-400"
          title={`${summary.performance_count} Performance Monitor(s)`}
        >
          <Activity size={12} /> {summary.performance_count}
        </span>
      )}
      {summary.availability_count > 0 && (
        <span
          className="flex items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-600 dark:text-green-400"
          title={`${summary.availability_count} Availability Monitor(s)`}
        >
          <CheckCircle size={12} /> {summary.availability_count}
        </span>
      )}
      <button
        className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Add Monitor"
        onClick={(e) => {
          e.stopPropagation()
          onAddMonitor?.(params.data)
        }}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

interface StatusCellProps {
  params: ICellRendererParams
}

function StatusCellRenderer({ params }: StatusCellProps) {
  const summary: MonitorSummary = params.value

  if (!summary || summary.total === 0) {
    return <span className="text-muted-foreground">No monitors</span>
  }

  return (
    <div className="flex h-full items-center gap-1.5">
      {summary.up_count > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {summary.up_count} Up
        </span>
      )}
      {summary.down_count > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {summary.down_count} Down
        </span>
      )}
      {summary.unknown_count > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-gray-500/10 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          {summary.unknown_count} Unknown
        </span>
      )}
    </div>
  )
}

interface ActionsCellProps {
  params: ICellRendererParams
  onEdit?: (data: any) => void
  onDelete?: (data: any) => void
}

function ActionsCellRenderer({ params, onEdit, onDelete }: ActionsCellProps) {
  if (!params.data) return null

  return (
    <div className="flex h-full items-center justify-center gap-2">
      <button
        className="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Edit Asset"
        onClick={(e) => {
          e.stopPropagation()
          onEdit?.(params.data)
        }}
      >
        <Edit size={16} />
      </button>
      <button
        className="rounded p-1 text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
        title="Delete Asset"
        onClick={(e) => {
          e.stopPropagation()
          onDelete?.(params.data)
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

// ==================== DETAIL GRID CELL RENDERERS ====================

function MonitorTypeCellRenderer({ params }: { params: ICellRendererParams }) {
  const type = params.value

  if (type === 'performance') {
    return (
      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
        <Activity size={14} /> Performance
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
      <CheckCircle size={14} /> Availability
    </span>
  )
}

function MonitorStatusCellRenderer({
  params,
}: {
  params: ICellRendererParams
}) {
  const status = params.value
  const isActive = params.data?.is_active

  if (!isActive) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Paused
      </span>
    )
  }

  if (status === 'up') {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Up
      </span>
    )
  }

  if (status === 'down') {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-600 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Down
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-gray-500/10 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Unknown
    </span>
  )
}

interface MonitorActionsCellProps {
  params: ICellRendererParams
  onToggle?: (data: any) => void
  onDelete?: (data: any) => void
}

function MonitorActionsCellRenderer({
  params,
  onToggle,
  onDelete,
}: MonitorActionsCellProps) {
  if (!params.data) return null

  const isActive = params.data.is_active

  return (
    <div className="flex h-full items-center justify-center gap-1">
      <button
        className={`rounded p-1 transition-colors ${
          isActive
            ? 'text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30'
            : 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30'
        }`}
        title={isActive ? 'Pause Monitor' : 'Resume Monitor'}
        onClick={(e) => {
          e.stopPropagation()
          onToggle?.(params.data)
        }}
      >
        {isActive ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        className="rounded p-1 text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
        title="Delete Monitor"
        onClick={(e) => {
          e.stopPropagation()
          onDelete?.(params.data)
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ==================== COLUMN DEFINITIONS ====================

/**
 * Observability table column definitions
 */
export const getObservabilityColumnDefs = (
  onAddMonitor?: (data: any) => void,
  onEdit?: (data: any) => void,
  onDelete?: (data: any) => void
): ColDef[] => [
  {
    field: 'name',
    headerName: 'Asset',
    tooltipField: 'name',
    headerTooltip: 'Asset Name',
    filter: 'agTextColumnFilter',
    valueGetter: getDisplayValue,
    cellRenderer: 'agGroupCellRenderer',
    filterParams: {
      filterOptions: ['contains', 'equals'],
      maxNumConditions: 1,
    },
    minWidth: 200,
    flex: 2,
  },
  {
    field: 'asset_type',
    headerName: 'Type',
    tooltipField: 'asset_type',
    headerTooltip: 'Asset Type',
    filter: 'agSetColumnFilter',
    valueFormatter: formatAssetType,
    minWidth: 220,
    flex: 1.5,
  },
  {
    field: 'description',
    headerName: 'Description',
    tooltipField: 'description',
    headerTooltip: 'Asset Description',
    filter: 'agTextColumnFilter',
    valueGetter: getDisplayValue,
    filterParams: {
      filterOptions: ['contains', 'equals'],
      maxNumConditions: 1,
    },
    minWidth: 180,
    flex: 1.5,
  },
  {
    field: 'monitor_summary',
    headerName: 'Monitors',
    headerTooltip: 'Monitor Types',
    filter: false,
    sortable: false,
    minWidth: 140,
    maxWidth: 160,
    cellRenderer: (params: ICellRendererParams) => (
      <MonitorsCellRenderer params={params} onAddMonitor={onAddMonitor} />
    ),
  },
  {
    field: 'monitor_summary',
    colId: 'status',
    headerName: 'Status',
    headerTooltip: 'Monitor Status Summary',
    filter: false,
    sortable: false,
    minWidth: 180,
    maxWidth: 220,
    cellRenderer: (params: ICellRendererParams) => (
      <StatusCellRenderer params={params} />
    ),
  },
  {
    field: 'last_check_at',
    headerName: 'Last Check',
    headerTooltip: 'Last Monitor Check',
    filter: false,
    sortable: true,
    valueFormatter: formatDate,
    minWidth: 130,
    maxWidth: 150,
  },
  {
    field: 'actions',
    headerName: 'Actions',
    headerTooltip: 'Actions',
    filter: false,
    sortable: false,
    resizable: false,
    suppressHeaderMenuButton: true,
    minWidth: 100,
    maxWidth: 120,
    cellStyle: { cursor: 'default' },
    cellRenderer: (params: ICellRendererParams) => (
      <ActionsCellRenderer params={params} onEdit={onEdit} onDelete={onDelete} />
    ),
  },
]

/**
 * Detail grid column definitions for monitors
 */
export const getMonitorDetailColumnDefs = (
  onToggle?: (data: any) => void,
  onDelete?: (data: any) => void
): ColDef[] => [
  {
    field: 'monitor_type',
    headerName: 'Type',
    headerTooltip: 'Monitor Type',
    minWidth: 120,
    maxWidth: 140,
    cellRenderer: (params: ICellRendererParams) => (
      <MonitorTypeCellRenderer params={params} />
    ),
  },
  {
    field: 'target',
    headerName: 'Target',
    headerTooltip: 'Monitor Target',
    tooltipField: 'target',
    minWidth: 150,
    flex: 1,
  },
  {
    field: 'protocol',
    headerName: 'Protocol',
    headerTooltip: 'Protocol / Circuit Type',
    minWidth: 100,
    maxWidth: 120,
    valueGetter: (params) => {
      return params.data?.protocol || params.data?.circuit_type || '-'
    },
    valueFormatter: (params) => {
      const val = params.value
      if (!val || val === '-') return '-'
      return val.toUpperCase()
    },
  },
  {
    field: 'check_interval',
    headerName: 'Interval',
    headerTooltip: 'Check Interval',
    minWidth: 90,
    maxWidth: 110,
    valueFormatter: (params) => {
      const seconds = params.value
      if (!seconds) return '-'
      if (seconds < 60) return `${seconds}s`
      return `${Math.floor(seconds / 60)}m`
    },
  },
  {
    field: 'current_status',
    headerName: 'Status',
    headerTooltip: 'Current Status',
    minWidth: 100,
    maxWidth: 120,
    cellRenderer: (params: ICellRendererParams) => (
      <MonitorStatusCellRenderer params={params} />
    ),
  },
  {
    field: 'last_check_at',
    headerName: 'Last Check',
    headerTooltip: 'Last Check Time',
    minWidth: 120,
    maxWidth: 140,
    valueFormatter: formatDate,
  },
  {
    field: 'actions',
    headerName: '',
    filter: false,
    sortable: false,
    resizable: false,
    suppressHeaderMenuButton: true,
    minWidth: 80,
    maxWidth: 100,
    cellRenderer: (params: ICellRendererParams) => (
      <MonitorActionsCellRenderer
        params={params}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    ),
  },
]

export default getObservabilityColumnDefs
