/**
 * Dashboard Map Component
 *
 * Placeholder for monitor locations map.
 * Shows "Coming Soon" message with future plans.
 */

import { MapPin, Globe2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardMapData } from '../../types'

interface DashboardMapProps {
  data: DashboardMapData | null
  isLoading?: boolean
}

export function DashboardMap({ data, isLoading }: DashboardMapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Monitor Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    )
  }

  // Show coming soon placeholder
  if (!data || data.coming_soon) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Monitor Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 400 300"
                className="stroke-current text-blue-600"
              >
                {/* Grid lines */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="0"
                    y1={i * 30}
                    x2="400"
                    y2={i * 30}
                    strokeWidth="1"
                  />
                ))}
                {Array.from({ length: 14 }).map((_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * 30}
                    y1="0"
                    x2={i * 30}
                    y2="300"
                    strokeWidth="1"
                  />
                ))}
              </svg>
            </div>

            {/* Placeholder pins */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute left-[20%] top-[30%] opacity-30">
                <MapPin size={24} className="text-blue-600" />
              </div>
              <div className="absolute left-[45%] top-[25%] opacity-30">
                <MapPin size={24} className="text-blue-600" />
              </div>
              <div className="absolute left-[70%] top-[40%] opacity-30">
                <MapPin size={24} className="text-blue-600" />
              </div>
              <div className="absolute left-[35%] top-[60%] opacity-30">
                <MapPin size={24} className="text-blue-600" />
              </div>
              <div className="absolute left-[60%] top-[70%] opacity-30">
                <MapPin size={24} className="text-blue-600" />
              </div>
            </div>

            {/* Coming soon overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/50">
                <Globe2 size={40} className="text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-400">
                Global Map
              </h3>
              <p className="mt-1 text-sm text-blue-600/70 dark:text-blue-400/60">
                Coming Soon
              </p>
              <p className="mt-2 max-w-xs text-xs text-muted-foreground">
                Visualize your monitors on a world map based on their target locations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Future: Real map implementation would go here
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Monitor Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          {data.locations.length} monitor locations
        </div>
      </CardContent>
    </Card>
  )
}
