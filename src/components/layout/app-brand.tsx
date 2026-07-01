import { IconDeviceDesktopSearch } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function AppBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' className='py-7' asChild>
          <Link to='/' className='gap-3'>
            <div className='flex aspect-square size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md'>
              <IconDeviceDesktopSearch className='size-7' />
            </div>
            <div className='grid flex-1 text-left leading-tight'>
              <span className='truncate font-mono text-2xl font-bold tracking-tight'>
                AssetWatch
              </span>
              <span className='truncate font-mono text-[11px] text-muted-foreground tracking-wider uppercase'>
                Monitoring
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
