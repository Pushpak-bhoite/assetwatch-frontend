/**
 * Users Actions Cell Renderer
 *
 * React component for rendering edit/delete actions in AG Grid cell.
 */

import { ICellRendererParams } from 'ag-grid-community'
import { Pencil, Trash2 } from 'lucide-react'

interface ActionsRendererParams extends ICellRendererParams {
  onEdit?: (data: any) => void
  onDelete?: (data: any) => void
}

export function UsersActionsCellRenderer(params: ActionsRendererParams) {
  const { data, onEdit, onDelete } = params

  if (!data) return null

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(data)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(data)
  }

  return (
    <div className="flex items-center justify-center gap-2 h-full">
      <button
        onClick={handleEdit}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Edit User"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={handleDelete}
        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
        title="Delete User"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export default UsersActionsCellRenderer
