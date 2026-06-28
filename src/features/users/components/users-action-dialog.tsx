/**
 * Users Action Dialog
 *
 * Dialog for creating and editing users.
 * Matches backend schema: name, email, password, organization_type
 */

'use client'

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
import { Switch } from '@/components/ui/switch'
import { PasswordInput } from '@/components/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import apiClient from '@/lib/api-client'
import { organizationTypes, organizationTypeLabels } from './users-ag-grid-columns'

// ==================== TYPES ====================

export interface User {
  id: string
  email: string
  name: string
  organization_type: string
  is_active: boolean
  is_verified: boolean
  is_superuser: boolean
  parent_organization_id?: string | null
}

interface UsersActionDialogProps {
  currentRow?: Partial<User> | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// ==================== SCHEMA ====================

const createUserSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required.' }),
    email: z
      .string()
      .min(1, { message: 'Email is required.' })
      .email({ message: 'Email is invalid.' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' }),
    confirmPassword: z.string(),
    organization_type: z.string().min(1, { message: 'Organization type is required.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

const editUserSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email(),
  organization_type: z.string(),
  is_active: z.boolean(),
  is_verified: z.boolean(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword
  }
  return true
}, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
})

type CreateUserForm = z.infer<typeof createUserSchema>
type EditUserForm = z.infer<typeof editUserSchema>

// ==================== COMPONENT ====================

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
  onSuccess,
}: UsersActionDialogProps) {
  const isEdit = !!currentRow
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateUserForm | EditUserForm>({
    resolver: zodResolver(isEdit ? editUserSchema : createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      organization_type: 'customer',
    },
  })

  // Reset form when dialog opens/closes or currentRow changes
  useEffect(() => {
    if (open) {
      if (isEdit && currentRow) {
        form.reset({
          name: currentRow.name,
          email: currentRow.email,
          organization_type: currentRow.organization_type,
          is_active: currentRow.is_active,
          is_verified: currentRow.is_verified,
          password: '',
          confirmPassword: '',
        })
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          organization_type: 'customer',
        })
      }
    }
  }, [open, isEdit, currentRow, form])

  const onSubmit = async (data: CreateUserForm | EditUserForm) => {
    setIsSubmitting(true)
    try {
      if (isEdit && currentRow) {
        // Update existing user - PATCH /users/{id}
        const editData = data as EditUserForm
        const updateData: any = {
          name: editData.name,
          is_active: editData.is_active,
          is_verified: editData.is_verified,
        }
        // Only include password if provided
        if (editData.password && editData.password.length > 0) {
          updateData.password = editData.password
        }
        
        await apiClient.patch(`/users/${currentRow.id}`, updateData)
        toast({
          title: 'User Updated',
          description: `${data.name} has been updated successfully.`,
        })
      } else {
        // Create new user - POST /auth/register
        const createData = data as CreateUserForm
        await apiClient.post('/auth/register', {
          name: createData.name,
          email: createData.email,
          password: createData.password,
          organization_type: createData.organization_type,
        })
        toast({
          title: 'User Created',
          description: `${createData.name} has been created successfully.`,
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} user`
      toast({
        variant: 'destructive',
        title: `${isEdit ? 'Update' : 'Create'} Failed`,
        description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the user details below.'
              : 'Fill in the details to create a new user.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Name */}
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., John Doe'
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='e.g., john@example.com'
                      {...field}
                      disabled={isSubmitting || isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization Type */}
            <FormField
              control={form.control}
              name='organization_type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Organization Type <span className='text-destructive'>*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || isEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select organization type'>
                          {field.value && organizationTypeLabels[field.value]}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status fields - only shown in edit mode */}
            {isEdit && (
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='is_active'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                      <div className='space-y-0.5'>
                        <FormLabel>Status</FormLabel>
                        <p className='text-sm text-muted-foreground'>
                          {field.value ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='is_verified'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                      <div className='space-y-0.5'>
                        <FormLabel>Verified</FormLabel>
                        <p className='text-sm text-muted-foreground'>
                          {field.value ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Password */}
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password {!isEdit && <span className='text-destructive'>*</span>}
                    {isEdit && <span className='text-muted-foreground text-xs'>(leave blank to keep current)</span>}
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder={isEdit ? 'Enter new password (optional)' : 'e.g., S3cur3P@ssw0rd'}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Confirm Password {!isEdit && <span className='text-destructive'>*</span>}
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Confirm password'
                      {...field}
                      disabled={isSubmitting || !form.watch('password')}
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
                  'Update User'
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default UsersActionDialog
