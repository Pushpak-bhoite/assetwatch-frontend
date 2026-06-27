/**
 * Monitoring Column Definitions
 *
 * AG Grid column configuration for the monitors table.
 */

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Monitor, MonitorType, MonitorStatus, MONITOR_TYPE_INFO } from '../types'
import {
  Globe,
  Activity,
  Server,
  Network,
  Play,
  Pause,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'

// ==================== HELPERS ====================

/**
 * Get monitor type icon
 */
const getMonitorTypeIcon = (type: MonitorType) => {
  switch (type) {
    case 'http':
      return Globe
    case 'ping':
      return Activity
    case 'port':
      return Server
    case 'dns':
      return Network
    default:
      return Globe
  }
}

/**
 * Get status color classes
 */
const getStatusClasses = (status: MonitorStatus): string => {
  switch (status) {
    case 'up':
      return 'bg-green-500/10 text-green-600 dark:text-green-400'
    case 'down':
      return 'bg-red-500/10 text-red-600 dark:text-red-400'
    case 'paused':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
    case 'unknown':
    default:
      return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
  }
}

/**
 * Get status dot color
 */
const getStatusDotColor = (status: MonitorStatus): string => {
  switch (status) {
    case 'up':
      return 'bg-green-500'
    case 'down':
      return 'bg-red-500'
    case 'paused':
      return 'bg-yellow-500'
    case 'unknown':
    default:
      return 'bg-gray-400'
  }
}

/**
 * Format interval for display
 */
const formatInterval = (interval: string): string => {
  const labels: Record<string, string> = {
    '30s': '30 sec',
    '1m': '1 min',
    '5m': '5 min',
    '15m': '15 min',
    '30m': '30 min',
    '1hr': '1 hour',
    '12hr': '12 hours',
  }
  return labels[interval] || interval
}

// ==================== CELL RENDERERS ====================

interface TargetCellProps {
  params: ICellRendererParams<Monitor>
}

function TargetCellRenderer({ params }: TargetCellProps) {
  const data = params.data
  if (!data) return null

  const Icon = getMonitorTypeIcon(data.monitor_type)
  const target = data.target
  const port = data.port

  return (
    <div className="flex h-full items-center gap-2">
      <Icon size={16} className="text-muted-foreground" />
      <span className="truncate font-medium">{target}</span>
      {port && (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          :{port}
        </span>
      )}
    </div>
  )
}

interface MonitorTypeCellProps {
  params: ICellRendererParams<Monitor>
}

function MonitorTypeCellRenderer({ params }: MonitorTypeCellProps) {
  const type = params.value as MonitorType
  if (!type) return null

  const Icon = getMonitorTypeIcon(type)
  const typeInfo = MONITOR_TYPE_INFO[type]

  return (
    <div className="flex h-full items-center gap-2">
      <span
        className="flex items-center gap-1.5 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        title={typeInfo?.description}
      >
        <Icon size={12} />
        {type.toUpperCase()}
      </span>
    </div>
  )
}

interface StatusCellProps {
  params: ICellRendererParams<Monitor>
}

function StatusCellRenderer({ params }: StatusCellProps) {
  const data = params.data
  if (!data) return null

  const status = data.is_active ? data.current_status : 'paused'
  const statusClasses = getStatusClasses(status)
  const dotColor = getStatusDotColor(status)

  return (
    <div className="flex h-full items-center">
      <span
        className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses}`}
      >
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  )
}

interface TagsCellProps {
  params: ICellRendererParams<Monitor>
}

function TagsCellRenderer({ params }: TagsCellProps) {
  const tags = params.value as string[]
  if (!tags || tags.length === 0) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <div className="flex h-full items-center gap-1 overflow-hidden">
      {tags.slice(0, 2).map((tag, index) => (
        <span
          key={index}
          className="truncate rounded bg-muted px-1.5 py-0.5 text-xs"
        >
          {tag}
        </span>
      ))}
      {tags.length > 2 && (
        <span className="text-xs text-muted-foreground">
          +{tags.length - 2}
        </span>
      )}
    </div>
  )
}

interface IntervalCellProps {
  params: ICellRendererParams<Monitor>
}

function IntervalCellRenderer({ params }: IntervalCellProps) {
  const interval = params.value as string
  return (
    <span className="text-sm text-muted-foreground">
      {formatInterval(interval)}
    </span>
  )
}

interface ActionsCellProps {
  params: ICellRendererParams<Monitor>
  onToggle?: (monitor: Monitor) => void
  onDelete?: (monitor: Monitor) => void
}

function ActionsCellRenderer({ params, onToggle, onDelete }: ActionsCellProps) {
  const data = params.data
  if (!data) return null

  return (
    <div className="flex h-full items-center justify-center gap-1">
      <button
        className={`rounded p-1.5 transition-colors ${
          data.is_active
            ? 'text-yellow-600 hover:bg-yellow-500/10'
            : 'text-green-600 hover:bg-green-500/10'
        }`}
        title={data.is_active ? 'Pause Monitor' : 'Resume Monitor'}
        onClick={(e) => {
          e.stopPropagation()
          onToggle?.(data)
        }}
      >
        {data.is_active ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <button
        className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-500/10"
        title="Delete Monitor"
        onClick={(e) => {
          e.stopPropagation()
          onDelete?.(data)
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

// ==================== COLUMN DEFINITIONS ====================

interface ColumnActions {
  onToggle?: (monitor: Monitor) => void
  onDelete?: (monitor: Monitor) => void
}

export function getMonitorColumnDefs(actions?: ColumnActions): ColDef<Monitor>[] {
  return [
    {
      field: 'target',
      headerName: 'Target',
      flex: 2,
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<Monitor>) => (
        <TargetCellRenderer params={params} />
      ),
    },
    {
      field: 'monitor_type',
      headerName: 'Type',
      width: 120,
      cellRenderer: (params: ICellRendererParams<Monitor>) => (
        <MonitorTypeCellRenderer params={params} />
      ),
    },
    {
      field: 'friendly_name',
      headerName: 'Friendly Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 150,
      cellRenderer: (params: ICellRendererParams<Monitor>) => (
        <TagsCellRenderer params={params} />
      ),
      sortable: false,
    },
    {
      field: 'check_interval',
      headerName: 'Interval',
      width: 100,
      cellRenderer: (params: ICellRendererParams<Monitor>) => (
        <IntervalCellRenderer params={params} />
      ),
    },
    {
      field: 'current_status',
      headerName: 'Status',
      width: 120,
      cellRenderer: (params: ICellRendererParams<Monitor>) => (
        <StatusCellRenderer params={params} />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<Monitor>) => (
        <ActionsCellRenderer
          params={params}
          onToggle={actions?.onToggle}
          onDelete={actions?.onDelete}
        />
      ),
    },
  ]
}
