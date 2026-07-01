import Cookies from 'js-cookie'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import SkipToMain from '@/components/skip-to-main'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/features/auth/api/auth.service'
import { Beacon } from '@/features/beacon'

const ACCESS_TOKEN_KEY = 'pushpak_access_token'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    // Check if user is authenticated
    const cookieState = Cookies.get(ACCESS_TOKEN_KEY)
    const token = cookieState ? JSON.parse(cookieState) : null

    if (!token) {
      // Redirect to sign-in with the current URL as redirect parameter
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const defaultOpen = Cookies.get('sidebar:state') !== 'false'
  const { user, setUser } = useAuthStore((state) => state.auth)
  const [isLoading, setIsLoading] = useState(!user)

  // Fetch user data if not already in store (e.g., on page refresh)
  useEffect(() => {
    async function fetchUser() {
      if (!user) {
        try {
          const userData = await authService.getCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error('Failed to fetch user:', error)
          // Token might be invalid, clear and redirect
          Cookies.remove(ACCESS_TOKEN_KEY)
          window.location.href = '/sign-in'
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchUser()
  }, [user, setUser])

  // Show loading while fetching user
  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
      </div>
    )
  }

  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'max-w-full w-full ml-auto',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'transition-[width] ease-linear duration-200',
            'h-svh flex flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh'
          )}
        >
          <Outlet />
        </div>
        {/* Beacon AI Assistant */}
        <Beacon />
      </SidebarProvider>
    </SearchProvider>
  )
}
