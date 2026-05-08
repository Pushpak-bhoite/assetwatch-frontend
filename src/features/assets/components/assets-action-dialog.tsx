/**
 * Assets Action Dialog
 *
 * Dialog for creating and editing assets.
 * Supports both Add and Edit modes with form validation.
 */

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconLoader } from '@tabler/icons-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import apiClient from '@/lib/api-client'
import { assetTypeCategories, allAssetTypes } from './assets-ag-grid-columns'

// ==================== TYPES ====================

export interface Asset {
  id: string
  name: string
  asset_type: string
  description?: string
  monitor_count: number
  created_at: string
  updated_at: string
}

interface AssetsActionDialogProps {
  currentRow?: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// ==================== SCHEMA ====================

const assetFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Asset name is required.' })
    .max(255, { message: 'Asset name must be 255 characters or less.' }),
  asset_type: z.string().min(1, { message: 'Asset type is required.' }),
  description: z
    .string()
    .max(1000, { message: 'Description must be 1000 characters or less.' })
    .optional()
    .or(z.literal('')),
})

type AssetFormData = z.infer<typeof assetFormSchema>

// ==================== COMPONENT ====================

export function AssetsActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSuccess,
}: AssetsActionDialogProps) {
  const isEdit = !!currentRow
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      asset_type: '',
      description: '',
    },
  })

  // Reset form when dialog opens/closes or currentRow changes
  useEffect(() => {
    if (open) {
      if (isEdit && currentRow) {
        form.reset({
          name: currentRow.name,
          asset_type: currentRow.asset_type,
          description: currentRow.description || '',
        })
      } else {
        form.reset({
          name: '',
          asset_type: '',
          description: '',
        })
      }
    }
  }, [open, isEdit, currentRow, form])

  const onSubmit = async (data: AssetFormData) => {
    setIsSubmitting(true)
    try {
      if (isEdit && currentRow) {
        // Update existing asset
        await apiClient.put(`/assets/${currentRow.id}`, {
          name: data.name,
          asset_type: data.asset_type,
          description: data.description || null,
        })
        toast({
          title: 'Asset Updated',
          description: `${data.name} has been updated successfully.`,
        })
      } else {
        // Create new asset
        await apiClient.post('/assets/', {
          name: data.name,
          asset_type: data.asset_type,
          description: data.description || null,
        })
        toast({
          title: 'Asset Created',
          description: `${data.name} has been created successfully.`,
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} asset`
      toast({
        variant: 'destructive',
        title: `${isEdit ? 'Update' : 'Create'} Failed`,
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Get short display name for asset type
   * e.g., "Circuit-Internet-Fiber Broadband" -> "Fiber Broadband"
   */
  const getShortAssetTypeName = (assetType: string): string => {
    const parts = assetType.split('-')
    if (parts.length >= 3) {
      return parts.slice(2).join('-')
    }
    if (parts.length === 2) {
      return parts[1]
    }
    return assetType
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the asset details below.'
              : 'Fill in the details to create a new asset.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Asset Name */}
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Asset Name <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., Main Office Router'
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Asset Type - Grouped Select */}
            <FormField
              control={form.control}
              name='asset_type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Asset Type <span className='text-destructive'>*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select asset type'>
                          {field.value}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <ScrollArea className='h-72'>
                        {Object.entries(assetTypeCategories).map(
                          ([category, types]) => (
                            <SelectGroup key={category}>
                              <SelectLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 px-2 py-2 -mx-1'>
                                {category}
                              </SelectLabel>
                              {types.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {/* {getShortAssetTypeName(type)} */}
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )
                        )}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Optional description of the asset...'
                      className='resize-none'
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className='pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <IconLoader className='mr-2 h-4 w-4 animate-spin' />
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEdit ? (
                  'Update Asset'
                ) : (
                  'Create Asset'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AssetsActionDialog
