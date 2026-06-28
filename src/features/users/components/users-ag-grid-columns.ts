/**
 * Users AG Grid Column Definitions
 *
 * Column configuration for the Users AG Grid table.
 * Uses built-in tooltips and standard AG Grid features.
 */

import { ColDef } from 'ag-grid-community'
import { UsersActionsCellRenderer } from './users-actions-cell-renderer'
import { UsersToggleCellRenderer } from './users-toggle-cell-renderer'

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
 * Format boolean value for display
 */
const formatBoolean = (params: any): string => {
  const value = params.value
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return '-'
}

/**
 * Organization type options for dropdowns
 */
export const organizationTypes = [
  { label: 'AssetWatch Admin', value: 'assetwatch' },
  { label: 'Customer', value: 'customer' },
  { label: 'Reseller', value: 'reseller' },
  { label: 'Reseller Customer', value: 'reseller_customer' },
]

/**
 * Organization type display mapping
 */
export const organizationTypeLabels: Record<string, string> = {
  assetwatch: 'AssetWatch Admin',
  customer: 'Customer',
  reseller: 'Reseller',
  reseller_customer: 'Reseller Customer',
}

/**
 * Format organization type for display
 */
const formatOrganizationType = (params: any): string => {
  const value = params.value
  if (!value) return '-'
  return organizationTypeLabels[value] || value
}

/**
 * Users table column definitions factory
 * Returns columns with action handlers
 */
export const getUsersColumnDefs = (
  onEdit?: (data: any) => void,
  onDelete?: (data: any) => void,
  onToggle?: (userId: string, field: string, newValue: boolean) => Promise<void>
): ColDef[] => [
  {
    field: 'name',
    headerName: 'Name',
    tooltipField: 'name',
    headerTooltip: 'User Name',
    filter: 'agTextColumnFilter',
    valueGetter: getDisplayValue,
    filterParams: {
      filterOptions: ['contains', 'equals'],
      maxNumConditions: 1,
    },
    minWidth: 150,
    flex: 1,
  },
  {
    field: 'email',
    headerName: 'Email',
    tooltipField: 'email',
    headerTooltip: 'Email Address',
    filter: 'agTextColumnFilter',
    valueGetter: getDisplayValue,
    filterParams: {
      filterOptions: ['contains', 'equals'],
      maxNumConditions: 1,
    },
    minWidth: 200,
    flex: 1.5,
  },
  {
    field: 'organization_type',
    headerName: 'Role',
    tooltipField: 'organization_type',
    headerTooltip: 'Organization Type / Role',
    filter: 'agSetColumnFilter',
    valueFormatter: formatOrganizationType,
    filterParams: {
      values: ['assetwatch', 'customer', 'reseller', 'reseller_customer'],
    },
    minWidth: 150,
  },
  {
    field: 'is_active',
    headerName: 'Status',
    headerTooltip: 'Active Status (Click to toggle)',
    filter: 'agSetColumnFilter',
    filterParams: {
      values: [true, false],
      valueFormatter: (params: any) => (params.value ? 'Active' : 'Inactive'),
    },
    cellRenderer: UsersToggleCellRenderer,
    cellRendererParams: {
      onToggle,
      field: 'is_active',
      activeLabel: 'Active',
      inactiveLabel: 'Inactive',
    },
    minWidth: 140,
    maxWidth: 160,
  },
  {
    field: 'is_verified',
    headerName: 'Verified',
    headerTooltip: 'Email Verified (Click to toggle)',
    filter: 'agSetColumnFilter',
    filterParams: {
      values: [true, false],
      valueFormatter: (params: any) => (params.value ? 'Yes' : 'No'),
    },
    cellRenderer: UsersToggleCellRenderer,
    cellRendererParams: {
      onToggle,
      field: 'is_verified',
      activeLabel: 'Verified',
      inactiveLabel: 'Unverified',
    },
    minWidth: 140,
    maxWidth: 160,
  },
  {
    field: 'is_superuser',
    headerName: 'Super Admin',
    headerTooltip: 'Is Super Admin',
    filter: 'agSetColumnFilter',
    valueFormatter: formatBoolean,
    filterParams: {
      values: [true, false],
      valueFormatter: (params: any) => (params.value ? 'Yes' : 'No'),
    },
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
    cellRenderer: UsersActionsCellRenderer,
    cellRendererParams: {
      onEdit,
      onDelete,
    },
  },
]

// Legacy export for backward compatibility
export const usersColumnDefs = getUsersColumnDefs()

export default getUsersColumnDefs
