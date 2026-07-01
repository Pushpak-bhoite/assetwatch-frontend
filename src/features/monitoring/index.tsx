import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { MonitorsTable } from './components'
import { Dashboard } from './components/dashboard'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutDashboard, List } from 'lucide-react'

type ViewTab = 'dashboard' | 'monitors'

export default function Monitoring() {
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard')

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {activeTab === 'dashboard' ? (
          <Dashboard />
        ) : (
          <div className="pt-4 pr-6 pb-6 pl-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 space-y-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Monitors</h2>
                <p className="text-muted-foreground">
                  Monitor the availability of your services, websites, and infrastructure
                </p>
              </div>
            </div>

            <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
              <div className="h-[calc(100vh-220px)]">
                <MonitorsTable />
              </div>
            </div>
          </div>
        )}

        {/* Fixed tab bar at bottom */}
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
            <TabsList className="h-12 px-2 shadow-lg">
              <TabsTrigger value="dashboard" className="gap-2 px-4">
                <LayoutDashboard size={16} />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="monitors" className="gap-2 px-4">
                <List size={16} />
                Monitors
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
