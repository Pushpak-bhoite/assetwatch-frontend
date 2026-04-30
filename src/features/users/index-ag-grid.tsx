/**
 * Users Page with AG Grid Table
 *
 * This is the main users page using the AG Grid table component
 * with server-side pagination.
 */

import { useState } from 'react'
import { IconMailPlus, IconUserPlus } from '@tabler/icons-react'
import useDialogState from '@/hooks/use-dialog-state'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersActionDialog } from './components/users-action-dialog'
import { UsersDeleteDialog } from './components/users-delete-dialog'
import { UsersInviteDialog } from './components/users-invite-dialog'
import { UsersAgGridTable } from './components/users-ag-grid-table'
import UsersContextProvider, {
  type UsersDialogType,
} from './context/users-context'

// Define a minimal User type for AG Grid data
interface AgGridUser {
  id: string
  email: string
  name: string
  organization_type: string
  is_active: boolean
  is_verified: boolean
  is_superuser: boolean
  parent_organization_id?: string | null
}

export default function UsersAgGrid() {
  // Dialog states
  const [currentRow, setCurrentRow] = useState<AgGridUser | null>(null)
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [selectedUsers, setSelectedUsers] = useState<AgGridUser[]>([])

  /**
   * Handle row click - can be used to open user details
   */
  const handleRowClicked = (data: AgGridUser) => {
    console.log('Row clicked:', data)
    // Optionally open edit dialog or navigate to details
    // setCurrentRow(data)
    // setOpen('edit')
  }

  /**
   * Handle selection change for bulk actions
   */
  const handleSelectionChanged = (selectedRows: AgGridUser[]) => {
    setSelectedUsers(selectedRows)
  }

  return (
    <UsersContextProvider value={{ open, setOpen, currentRow: currentRow as any, setCurrentRow: setCurrentRow as any }}>
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
              onClick={() => setOpen('invite')}
            >
              <span>Invite User</span> <IconMailPlus size={18} />
            </Button>
            <Button className='space-x-1' onClick={() => setOpen('add')}>
              <span>Add User</span> <IconUserPlus size={18} />
            </Button>
          </div>
        </div>

        {/* AG Grid Users Table */}
        <div className='flow-root'>
          <div className='-mx-4 -my-2 sm:-mx-6 lg:-mx-8'>
            <div className='py-2 align-middle sm:px-6 lg:px-8'>
              <UsersAgGridTable
                rowSelection='multiRow'
                onRowClicked={handleRowClicked}
                onSelectionChanged={handleSelectionChanged}
              />
            </div>
          </div>
        </div>
      </Main>

      {/* Dialogs */}
      <UsersActionDialog
        key='user-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      <UsersInviteDialog
        key='user-invite'
        open={open === 'invite'}
        onOpenChange={() => setOpen('invite')}
      />

      {currentRow && (
        <>
          <UsersActionDialog
            key={`user-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow as any}
          />

          <UsersDeleteDialog
            key={`user-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow as any}
          />
        </>
      )}
    </UsersContextProvider>
  )
}
