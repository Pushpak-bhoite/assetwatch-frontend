/**
 * Users Page with AG Grid Table
 *
 * This is the main users page using the AG Grid table component
 * with server-side pagination, edit/delete actions.
 */

import { useState, useCallback } from 'react'
import { IconMailPlus, IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersActionDialog, User } from './components/users-action-dialog'
import { UsersInviteDialog } from './components/users-invite-dialog'
import { UsersAgGridTable } from './components/users-ag-grid-table'
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

export default function UsersAgGrid() {
  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])

  // Table refresh key - increment to force refresh
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * Handle add new user - open dialog in add mode
   */
  const handleAddUser = useCallback(() => {
    setCurrentUser(null)
    setActionDialogOpen(true)
  }, [])

  /**
   * Handle edit action - open dialog in edit mode
   */
  const handleEdit = useCallback((user: User) => {
    setCurrentUser(user)
    setActionDialogOpen(true)
  }, [])

  /**
   * Handle dialog close
   */
  const handleActionDialogClose = useCallback((open: boolean) => {
    setActionDialogOpen(open)
    if (!open) {
      setTimeout(() => setCurrentUser(null), 200)
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
  const handleDelete = useCallback((user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }, [])

  /**
   * Confirm delete action
   */
  const confirmDelete = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      await apiClient.delete(`/users/${userToDelete.id}`)
      toast({
        title: 'User Deleted',
        description: `${userToDelete.name} has been deleted successfully.`,
      })
      setRefreshKey((k) => k + 1)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.response?.data?.detail || 'Failed to delete user',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  /**
   * Handle row click
   */
  const handleRowClicked = useCallback((data: User) => {
    console.log('Row clicked:', data)
  }, [])

  /**
   * Handle selection change for bulk actions
   */
  const handleSelectionChanged = useCallback((selectedRows: User[]) => {
    setSelectedUsers(selectedRows)
  }, [])

  /**
   * Handle toggle for status/verified fields
   */
  const handleToggle = useCallback(async (userId: string, field: string, newValue: boolean) => {
    try {
      await apiClient.patch(`/users/${userId}`, { [field]: newValue })
      toast({
        title: 'User Updated',
        description: `User ${field === 'is_active' ? 'status' : 'verification'} has been updated.`,
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.response?.data?.detail || `Failed to update user ${field}`,
      })
      throw error // Re-throw to prevent UI update
    }
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
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          <div className='flex gap-2'>
            {selectedUsers.length > 0 && (
              <span className='text-sm text-muted-foreground self-center mr-2'>
                {selectedUsers.length} selected
              </span>
            )}
            <Button
              variant='outline'
              className='space-x-1'
              onClick={() => setInviteDialogOpen(true)}
            >
              <span>Invite User</span> <IconMailPlus size={18} />
            </Button>
            <Button className='space-x-1' onClick={handleAddUser}>
              <span>Add User</span> <IconUserPlus size={18} />
            </Button>
          </div>
        </div>

        {/* AG Grid Users Table */}
        <div className='flow-root'>
          <div className='-mx-4 -my-2 sm:-mx-6 lg:-mx-8'>
            <div className='py-2 align-middle sm:px-6 lg:px-8'>
              <UsersAgGridTable
                key={refreshKey}
                rowSelection='multiRow'
                onRowClicked={handleRowClicked}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onSelectionChanged={handleSelectionChanged}
              />
            </div>
          </div>
        </div>
      </Main>

      {/* Add/Edit User Dialog */}
      <UsersActionDialog
        currentRow={currentUser}
        open={actionDialogOpen}
        onOpenChange={handleActionDialogClose}
        onSuccess={handleActionSuccess}
      />

      {/* Invite User Dialog */}
      <UsersInviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{userToDelete?.name}</span> (
              {userToDelete?.email})?
              <br />
              <br />
              This action cannot be undone.
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
    </>
  )
}
