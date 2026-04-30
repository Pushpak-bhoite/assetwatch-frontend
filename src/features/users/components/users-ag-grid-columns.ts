/**
 * Users AG Grid Column Definitions
 *
 * Column configuration for the Users AG Grid table.
 * Uses built-in tooltips and standard AG Grid features.
 */

import { ColDef } from 'ag-grid-community'

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
 * Organization type display mapping
 */
const organizationTypeLabels: Record<string, string> = {
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
 * Users table column definitions
 */
export const usersColumnDefs: ColDef[] = [
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
    headerTooltip: 'Active Status',
    filter: 'agSetColumnFilter',
    valueFormatter: (params) => (params.value ? 'Active' : 'Inactive'),
    filterParams: {
      values: [true, false],
      valueFormatter: (params: any) => (params.value ? 'Active' : 'Inactive'),
    },
    cellStyle: (params) => ({
      color: params.value ? 'var(--success-color, #22c55e)' : 'var(--muted-color, #6b7280)',
      fontWeight: 500,
    }),
    minWidth: 100,
    maxWidth: 120,
  },
  {
    field: 'is_verified',
    headerName: 'Verified',
    headerTooltip: 'Email Verified',
    filter: 'agSetColumnFilter',
    valueFormatter: formatBoolean,
    filterParams: {
      values: [true, false],
      valueFormatter: (params: any) => (params.value ? 'Yes' : 'No'),
    },
    minWidth: 100,
    maxWidth: 120,
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
    hide: true, // Hidden by default, can be shown via column menu
  },
]

export default usersColumnDefs
