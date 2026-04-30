/**
 * AG Grid Configuration
 * 
 * This file handles AG Grid Enterprise module registration and license setup.
 * Import this file once in your app entry point (main.tsx) to initialize AG Grid.
 */

import {
  AllCommunityModule,
  ColumnAutoSizeModule,
  ModuleRegistry,
} from 'ag-grid-community'

import {
  ColumnMenuModule,
  ColumnsToolPanelModule,
  ContextMenuModule,
  RowGroupingModule,
  SetFilterModule,
  ServerSideRowModelModule,
  LicenseManager,
  TreeDataModule,
  ServerSideRowModelApiModule,
  PaginationModule,
  ValidationModule,
  GridStateModule,
  TextFilterModule,
  ColumnApiModule,
  RowGroupingPanelModule,
  MasterDetailModule,
  RichSelectModule,
  StatusBarModule,
} from 'ag-grid-enterprise'

// Register all Community and Enterprise features
ModuleRegistry.registerModules([
  // Community modules
  AllCommunityModule,
  ColumnAutoSizeModule,
  // Enterprise modules
  RowGroupingModule,
  SetFilterModule,
  ColumnMenuModule,
  ColumnsToolPanelModule,
  ContextMenuModule,
  TreeDataModule,
  ServerSideRowModelModule,
  ServerSideRowModelApiModule,
  PaginationModule,
  ValidationModule,
  GridStateModule,
  TextFilterModule,
  ColumnApiModule,
  RowGroupingPanelModule,
  MasterDetailModule,
  RichSelectModule,
  StatusBarModule,
])

// Set license key if available
const licenseKey = import.meta.env.VITE_AGGRID_LICENSE

if (licenseKey) {
  LicenseManager.setLicenseKey(licenseKey)
} else {
  console.warn(
    'AG Grid Enterprise license key missing — running in evaluation mode with watermark.'
  )
}

// Export for type checking
export const AG_GRID_INITIALIZED = true
