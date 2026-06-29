import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth, useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { profileService } from '@/features/users/api/profile.service'
import apiClient from '@/lib/api-client'

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'Name must be at least 2 characters.',
    })
    .max(50, {
      message: 'Name must not be longer than 50 characters.',
    }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// Get initials from name
function getInitials(name: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Get badge variant based on organization type
function getOrgTypeBadge(orgType: string) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    assetwatch: { variant: 'destructive', label: 'AssetWatch Admin' },
    customer: { variant: 'default', label: 'Customer' },
    reseller: { variant: 'secondary', label: 'Reseller' },
    reseller_customer: { variant: 'outline', label: 'Reseller Customer' },
  }
  return variants[orgType] || { variant: 'outline' as const, label: orgType }
}

export default function ProfileForm() {
  const { user } = useAuth()
  const { setUser } = useAuthStore((state) => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
    },
    mode: 'onChange',
  })

  // Update form when user data loads (e.g., after page refresh)
  useEffect(() => {
    if (user?.name) {
      form.reset({ name: user.name })
    }
  }, [user, form])

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    try {
      // Update user profile via PATCH /users/me
      const response = await apiClient.patch('/users/me', { name: data.name })
      
      // Update auth store with new user data
      if (user) {
        setUser({ ...user, name: data.name })
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.response?.data?.detail || 'Failed to update profile.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, GIF, or WebP image.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      })
      return
    }

    setIsImageLoading(true)
    try {
      const result = await profileService.uploadProfileImage(file)
      
      // Update auth store with new profile image
      if (user) {
        setUser({ ...user, profile_image_url: result.profile_image_url })
      }

      toast({
        title: 'Image uploaded',
        description: 'Your profile image has been updated.',
      })
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error?.response?.data?.detail || 'Failed to upload image.',
        variant: 'destructive',
      })
    } finally {
      setIsImageLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleImageDelete() {
    setIsImageLoading(true)
    try {
      await profileService.deleteProfileImage()
      
      // Update auth store to remove profile image
      if (user) {
        setUser({ ...user, profile_image_url: null })
      }

      toast({
        title: 'Image removed',
        description: 'Your profile image has been removed.',
      })
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.response?.data?.detail || 'Failed to remove image.',
        variant: 'destructive',
      })
    } finally {
      setIsImageLoading(false)
    }
  }

  const orgBadge = getOrgTypeBadge(user?.organization_type || 'customer')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {/* Profile Image Section */}
        <div className='space-y-4'>
          <FormLabel>Profile Image</FormLabel>
          <div className='flex items-center gap-6'>
            <div className='relative'>
              <Avatar className='h-24 w-24'>
                <AvatarImage 
                  src={user?.profile_image_url || undefined} 
                  alt={user?.name || 'Profile'} 
                />
                <AvatarFallback className='text-2xl'>
                  {getInitials(user?.name || '')}
                </AvatarFallback>
              </Avatar>
              {isImageLoading && (
                <div className='absolute inset-0 flex items-center justify-center bg-black/50 rounded-full'>
                  <Loader2 className='h-6 w-6 animate-spin text-white' />
                </div>
              )}
            </div>
            <div className='flex flex-col gap-2'>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/gif,image/webp'
                onChange={handleImageUpload}
                className='hidden'
                disabled={isImageLoading}
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => fileInputRef.current?.click()}
                disabled={isImageLoading}
              >
                <Camera className='mr-2 h-4 w-4' />
                Change Image
              </Button>
              {user?.profile_image_url && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={handleImageDelete}
                  disabled={isImageLoading}
                  className='text-destructive hover:text-destructive'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Remove
                </Button>
              )}
              <p className='text-xs text-muted-foreground'>
                JPEG, PNG, GIF or WebP. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Name Field */}
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Your name' {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field (Read-only) */}
        <div className='space-y-2'>
          <FormLabel>Email</FormLabel>
          <Input 
            value={user?.email || ''} 
            disabled 
            className='bg-muted'
          />
          <p className='text-sm text-muted-foreground'>
            Your email address cannot be changed.
          </p>
        </div>

        {/* Organization Type (Read-only Badge) */}
        <div className='space-y-2'>
          <FormLabel>Account Type</FormLabel>
          <div>
            <Badge variant={orgBadge.variant}>{orgBadge.label}</Badge>
          </div>
          <p className='text-sm text-muted-foreground'>
            Your account type determines your permissions.
          </p>
        </div>

        <Button type='submit' disabled={isLoading}>
          {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Update profile
        </Button>
      </form>
    </Form>
  )
}
