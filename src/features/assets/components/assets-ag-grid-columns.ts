/**
 * Assets AG Grid Column Definitions
 *
 * Column configuration for the Assets AG Grid table.
 * Includes asset types grouped by category for filtering.
 */

import { ColDef } from 'ag-grid-community'
import { AssetsActionsCellRenderer } from './assets-actions-cell-renderer'

/**
 * Asset types grouped by category for the filter dropdown
 */
export const assetTypeCategories = {
  'Circuit - Internet': [
    'Circuit-Internet-Cable Broadband',
    'Circuit-Internet-Fiber Broadband',
    'Circuit-Internet-Copper Broadband',
    'Circuit-Internet-Wireless Broadband',
    'Circuit-Internet-Wireless 4G Broadband',
    'Circuit-Internet-Wireless 5G Broadband',
    'Circuit-Internet-Satellite Broadband',
    'Circuit-Internet-Dedicated Internet Access',
  ],
  'Circuit - Enterprise': [
    'Circuit-MPLS',
    'Circuit-Private Line',
    'Circuit-PRI',
    'Circuit-POTS',
    'Circuit-SIP',
  ],
  'Network Assets': [
    'Network Asset-IP Block',
    'Network Asset-Router',
    'Network Asset-SD-WAN',
    'Network Asset-Switch',
    'Network Asset-Wireless Access Point (WAP)',
    'Network Asset-Load Balancer',
  ],
  'Security Assets': [
    'Security Asset-Firewall',
    'Security Asset-Intrusion Detection System (IDS)',
    'Security Asset-Intrusion Prevention System (IPS)',
    'Security Asset-Network Detection & Response (NDR)',
    'Security Asset-Web Application Firewall (WAF)',
  ],
  'Compute Assets': [
    'Compute Asset-Server',
    'Compute Asset-Laptop',
    'Compute Asset-Desktop',
  ],
  'Storage Assets': ['Storage Asset-Storage Area Network (SAN)'],
}

/**
 * Flat list of all asset types for filter values
 */
export const allAssetTypes = Object.values(assetTypeCategories).flat()

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
 * Format date value for display
 */
const formatDate = (params: any): string => {
  const value = params.value
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '-'
  }
}

/**
 * Format asset type for display - extracts the specific type from full string
 */
const formatAssetType = (params: any): string => {
  const value = params.value
  if (!value) return '-'
  // Extract the type after the last hyphen (e.g., "Circuit-Internet-Fiber Broadband" -> "Fiber Broadband")
  const parts = value.split('-')
  if (parts.length >= 3) {
    return parts.slice(2).join('-')
  }
  if (parts.length === 2) {
    return parts[1]
  }
  return value
}

/**
 * Get asset type category from full type string
 */
export const getAssetTypeCategory = (assetType: string): string => {
  for (const [category, types] of Object.entries(assetTypeCategories)) {
    if (types.includes(assetType)) {
      return category
    }
  }
  return 'Other'
}

/**
 * Assets table column definitions
 */
export const getAssetsColumnDefs = (
  onEdit?: (data: any) => void,
  onDelete?: (data: any) => void
): ColDef[] => [
  {
    field: 'name',
    headerName: 'Asset Name',
    tooltipField: 'name',
    headerTooltip: 'Asset Name',
    filter: 'agTextColumnFilter',
    valueGetter: getDisplayValue,
    filterParams: {
      filterOptions: ['contains', 'equals'],
      maxNumConditions: 1,
    },
    minWidth: 180,
    flex: 2,
  },
  {
    field: 'asset_type',
    headerName: 'Asset Type',
    tooltipField: 'asset_type',
    headerTooltip: 'Asset Type',
    filter: 'agSetColumnFilter',
    valueFormatter: formatAssetType,
    filterParams: {
      values: allAssetTypes,
    },
    minWidth: 180,
    flex: 1.5,
  },
  {
    field: 'description',
    headerName: 'Description',
    tooltipField: 'description',
    headerTooltip: 'Description',
    filter: 'agTextColumnFilter',
    valueGetter: getDisplayValue,
    filterParams: {
      filterOptions: ['contains'],
      maxNumConditions: 1,
    },
    minWidth: 200,
    flex: 2,
  },
  {
    field: 'monitor_count',
    headerName: 'Monitors',
    headerTooltip: 'Number of Monitors',
    filter: false,
    sortable: true,
    valueFormatter: (params) => {
      const count = params.value ?? 0
      return count === 0 ? 'No monitors' : `${count} monitor${count > 1 ? 's' : ''}`
    },
    cellStyle: (params) => ({
      color:
        params.value > 0
          ? 'var(--success-color, #22c55e)'
          : 'var(--muted-color, #6b7280)',
    }),
    minWidth: 120,
    maxWidth: 140,
  },
  {
    field: 'created_at',
    headerName: 'Created',
    headerTooltip: 'Created Date',
    filter: false,
    sortable: true,
    valueFormatter: formatDate,
    minWidth: 120,
    maxWidth: 140,
  },
  {
    field: 'updated_at',
    headerName: 'Updated',
    headerTooltip: 'Last Updated',
    filter: false,
    sortable: true,
    valueFormatter: formatDate,
    minWidth: 120,
    maxWidth: 140,
    hide: true, // Hidden by default
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
    cellRenderer: AssetsActionsCellRenderer,
    cellRendererParams: {
      onEdit,
      onDelete,
    },
  },
]

export default getAssetsColumnDefs
