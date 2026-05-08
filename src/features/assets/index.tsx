/**
 * Assets Page with AG Grid Table
 *
 * Main assets page using the AG Grid table component
 * with server-side pagination.
 */

import { useState, useCallback } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AssetsAgGridTable } from './components/assets-ag-grid-table'
import { AssetsActionDialog, Asset } from './components/assets-action-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import apiClient from '@/lib/api-client'

export default function Assets() {
  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([])

  // Table refresh key - increment to force refresh
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * Handle add new asset - open dialog in add mode
   */
  const handleAddAsset = useCallback(() => {
    setCurrentAsset(null)
    setActionDialogOpen(true)
  }, [])

  /**
   * Handle edit action - open dialog in edit mode
   */
  const handleEdit = useCallback((asset: Asset) => {
    setCurrentAsset(asset)
    setActionDialogOpen(true)
  }, [])

  /**
   * Handle dialog close
   */
  const handleActionDialogClose = useCallback((open: boolean) => {
    setActionDialogOpen(open)
    if (!open) {
      // Clear current asset when dialog closes
      setTimeout(() => setCurrentAsset(null), 200)
    }
  }, [])

  /**
   * Handle successful create/update
   */
  const handleActionSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  /**
   * Handle delete action - show confirmation dialog
   */
  const handleDelete = useCallback((asset: Asset) => {
    setAssetToDelete(asset)
    setDeleteDialogOpen(true)
  }, [])

  /**
   * Confirm delete action
   */
  const confirmDelete = async () => {
    if (!assetToDelete) return

    setIsDeleting(true)
    try {
      await apiClient.delete(`/assets/${assetToDelete.id}`)
      toast({
        title: 'Asset Deleted',
        description: `${assetToDelete.name} has been deleted successfully.`,
      })
      // Refresh the table
      setRefreshKey((k) => k + 1)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.response?.data?.detail || 'Failed to delete asset',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setAssetToDelete(null)
    }
  }

  /**
   * Handle selection change
   */
  const handleSelectionChanged = useCallback((assets: Asset[]) => {
    setSelectedAssets(assets)
  }, [])

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4 flex items-center justify-between space-y-2 flex-wrap'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Assets</h2>
            <p className='text-muted-foreground'>
              Manage your network assets and monitors here.
            </p>
          </div>
          <div className='flex gap-2'>
            {selectedAssets.length > 0 && (
              <span className='text-sm text-muted-foreground self-center mr-2'>
                {selectedAssets.length} selected
              </span>
            )}
            <Button className='space-x-1' onClick={handleAddAsset}>
              <IconPlus size={18} />
              <span>Add Asset</span>
            </Button>
          </div>
        </div>

        {/* AG Grid Assets Table */}
        <div className='flow-root'>
          <div className='-mx-4 -my-2 sm:-mx-6 lg:-mx-8'>
            <div className='py-2 align-middle sm:px-6 lg:px-8'>
              <AssetsAgGridTable
                key={refreshKey}
                rowSelection='multiRow'
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSelectionChanged={handleSelectionChanged}
              />
            </div>
          </div>
        </div>
      </Main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{assetToDelete?.name}</span>?
              <br />
              <br />
              This will also delete all monitors attached to this asset. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Asset Dialog */}
      <AssetsActionDialog
        currentRow={currentAsset}
        open={actionDialogOpen}
        onOpenChange={handleActionDialogClose}
        onSuccess={handleActionSuccess}
      />
    </>
  )
}
