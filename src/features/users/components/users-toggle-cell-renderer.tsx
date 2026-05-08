/**
 * Users Toggle Cell Renderer
 *
 * React component for rendering toggleable boolean fields in AG Grid cell.
 * Used for Status (is_active) and Verified (is_verified) columns.
 */

import { ICellRendererParams } from 'ag-grid-community'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface ToggleCellRendererParams extends ICellRendererParams {
  onToggle?: (userId: string, field: string, newValue: boolean) => Promise<void>
  field: string
  activeLabel?: string
  inactiveLabel?: string
}

export function UsersToggleCellRenderer(params: ToggleCellRendererParams) {
  const { data, value, onToggle, field, activeLabel = 'Yes', inactiveLabel = 'No' } = params

  if (!data) return null

  const isActive = Boolean(value)

  const handleToggle = async (checked: boolean) => {
    if (onToggle) {
      try {
        await onToggle(data.id, field, checked)
        // Update the cell value in the grid
        if (params.node) {
          params.node.setDataValue(field, checked)
        }
      } catch (error) {
        console.error(`Failed to update ${field}:`, error)
        // Value will revert since we didn't update it
      }
    }
  }

  return (
    <div className="flex items-center gap-2 h-full">
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-green-500"
      />
      <span
        className={cn(
          'text-sm font-medium',
          isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
        )}
      >
        {isActive ? activeLabel : inactiveLabel}
      </span>
    </div>
  )
}

export default UsersToggleCellRenderer
