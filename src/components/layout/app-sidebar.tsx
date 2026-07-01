import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { AppBrand } from '@/components/layout/app-brand'
import { sidebarData } from './data/sidebar-data'
import { useAuth } from '@/stores/authStore'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  // Build user data from auth store with fallbacks
  const userData = {
    name: user?.name || 'User',
    email: user?.email || '',
    avatar: user?.profile_image_url || '/avatars/shadcn.jpg',
  }

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <AppBrand />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
