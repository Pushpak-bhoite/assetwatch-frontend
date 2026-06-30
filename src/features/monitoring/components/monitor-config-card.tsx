/**
 * Monitor Config Card Component
 *
 * Displays monitor-specific configuration:
 * - HTTP: URL, Method (Coming Soon), Timeout (Coming Soon), SSL Verify (Coming Soon)
 * - Ping: Host
 * - Port: Host, Port, Protocol
 * - DNS: Hostname, Record Type, Expected Value, DNS Server
 */

import { Settings, Globe, Activity, Server, Network, Lock, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MonitorDetail, MONITOR_TYPE_INFO } from '../types'
import { cn } from '@/lib/utils'

interface MonitorConfigCardProps {
  monitor: MonitorDetail
}

export function MonitorConfigCard({ monitor }: MonitorConfigCardProps) {
  // Get monitor type icon
  const getTypeIcon = () => {
    switch (monitor.monitor_type) {
      case 'http':
        return Globe
      case 'ping':
        return Activity
      case 'port':
        return Server
      case 'dns':
        return Network
      default:
        return Settings
    }
  }

  const TypeIcon = getTypeIcon()

  // Build config items based on monitor type
  const getConfigItems = () => {
    const items: { label: string; value: string | null; comingSoon?: boolean }[] = []

    switch (monitor.monitor_type) {
      case 'http':
        items.push({ label: 'URL', value: monitor.target })
        items.push({ label: 'Method', value: 'GET', comingSoon: true })
        items.push({ label: 'Timeout', value: '30s', comingSoon: true })
        items.push({ label: 'SSL Verify', value: 'Yes', comingSoon: true })
        break

      case 'ping':
        items.push({ label: 'Host', value: monitor.target })
        items.push({ label: 'Packet Count', value: '4', comingSoon: true })
        break

      case 'port':
        items.push({ label: 'Host', value: monitor.target })
        items.push({ label: 'Port', value: monitor.port?.toString() || '-' })
        if (monitor.port_name) {
          items.push({ label: 'Service', value: monitor.port_name })
        }
        items.push({ label: 'Protocol', value: 'TCP' })
        break

      case 'dns':
        items.push({ label: 'Hostname', value: monitor.target })
        if (monitor.record_type) {
          items.push({ label: 'Record Type', value: monitor.record_type })
        }
        if (monitor.expected_value) {
          items.push({ label: 'Expected Value', value: monitor.expected_value })
        }
        if (monitor.dns_server) {
          items.push({ label: 'DNS Server', value: monitor.dns_server })
        }
        break
    }

    return items
  }

  const configItems = getConfigItems()
  const typeInfo = MONITOR_TYPE_INFO[monitor.monitor_type as keyof typeof MONITOR_TYPE_INFO]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TypeIcon size={18} className="text-primary" />
          <CardTitle className="text-base font-medium">
            {monitor.monitor_type.toUpperCase()} Monitor Configuration
          </CardTitle>
        </div>
        {typeInfo && (
          <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {configItems.map((item, index) => (
            <div key={index} className="flex items-start justify-between gap-4">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                {item.comingSoon && (
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                )}
                <span
                  className={cn(
                    'text-right text-sm font-medium',
                    item.comingSoon && 'text-muted-foreground'
                  )}
                >
                  {item.value || '-'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tags Section */}
        {monitor.tags && monitor.tags.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 text-sm text-muted-foreground">Tags</p>
            <div className="flex flex-wrap gap-1">
              {monitor.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notification Settings */}
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-sm text-muted-foreground">Notifications</p>
          <div className="flex items-center gap-2 text-sm">
            {monitor.notify_email ? (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Email notifications enabled</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-muted-foreground">
                  Email notifications disabled
                </span>
              </>
            )}
          </div>
        </div>

        {/* Created/Updated Info */}
        <div className="mt-4 border-t pt-4 text-xs text-muted-foreground">
          <p>
            Created:{' '}
            {new Date(
              monitor.created_at.endsWith('Z')
                ? monitor.created_at
                : `${monitor.created_at}Z`
            ).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
