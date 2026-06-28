/**
 * Edit Monitor Dialog
 *
 * Modal dialog for editing an existing monitor with type-specific form fields.
 */

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'
import {
  Monitor,
  MonitorType,
  MONITOR_TYPE_INFO,
  INTERVAL_OPTIONS,
  TCP_PORT_OPTIONS,
  DNS_RECORD_TYPES,
} from '../types'
import { Globe, Activity, Server, Network, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { TagInput } from './tag-input'

// ==================== SCHEMAS ====================

const baseSchema = z.object({
  friendly_name: z.string().min(1, 'Friendly name is required').max(255),
  tags: z.array(z.string()).optional().default([]),
  notify_email: z.boolean().default(true),
  check_interval: z.string().default('5m'),
})

const httpSchema = baseSchema.extend({
  monitor_type: z.literal('http'),
  url: z
    .string()
    .min(1, 'URL is required')
    .refine(
      (val) => val.startsWith('http://') || val.startsWith('https://'),
      'URL must start with http:// or https://'
    ),
})

const pingSchema = baseSchema.extend({
  monitor_type: z.literal('ping'),
  host: z.string().min(1, 'IP or host is required'),
})

const portSchema = baseSchema.extend({
  monitor_type: z.literal('port'),
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().min(1).max(65535),
  port_name: z.string().optional(),
})

const dnsSchema = baseSchema.extend({
  monitor_type: z.literal('dns'),
  hostname: z.string().min(1, 'Hostname is required'),
  dns_server: z.string().optional(),
  record_type: z.string().default('A'),
  expected_value: z.string().optional(),
})

type HTTPFormValues = z.infer<typeof httpSchema>
type PingFormValues = z.infer<typeof pingSchema>
type PortFormValues = z.infer<typeof portSchema>
type DNSFormValues = z.infer<typeof dnsSchema>

type FormValues = HTTPFormValues | PingFormValues | PortFormValues | DNSFormValues

// ==================== COMPONENT ====================

interface EditMonitorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  monitor: Monitor | null
  onSuccess?: () => void
}

const MonitorTypeDisplay = ({ type }: { type: MonitorType }) => {
  const info = MONITOR_TYPE_INFO[type]
  const icons: Record<MonitorType, typeof Globe> = {
    http: Globe,
    ping: Activity,
    port: Server,
    dns: Network,
  }
  const Icon = icons[type]

  return (
    <div className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 p-4">
      <Icon size={20} className="text-primary" />
      <div>
        <span className="font-medium">{info.title}</span>
        <p className="text-xs text-muted-foreground">{info.description}</p>
      </div>
    </div>
  )
}

export function EditMonitorDialog({
  open,
  onOpenChange,
  monitor,
  onSuccess,
}: EditMonitorDialogProps) {
  const { toast } = useToast()
  const { auth } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState<string[]>([])

  const monitorType = monitor?.monitor_type || 'http'

  // Get the appropriate schema based on monitor type
  const getSchema = () => {
    switch (monitorType) {
      case 'http':
        return httpSchema
      case 'ping':
        return pingSchema
      case 'port':
        return portSchema
      case 'dns':
        return dnsSchema
      default:
        return httpSchema
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      monitor_type: monitorType,
      friendly_name: '',
      tags: [],
      notify_email: true,
      check_interval: '5m',
      url: '',
      host: '',
      port: 80,
      port_name: '',
      hostname: '',
      dns_server: '',
      record_type: 'A',
      expected_value: '',
    } as any,
  })

  // Populate form when monitor changes
  useEffect(() => {
    if (monitor && open) {
      const monitorTags = monitor.tags || []
      setTags(monitorTags)

      const baseValues = {
        monitor_type: monitor.monitor_type,
        friendly_name: monitor.friendly_name,
        tags: monitorTags,
        notify_email: monitor.notify_email,
        check_interval: monitor.check_interval,
      }

      switch (monitor.monitor_type) {
        case 'http':
          form.reset({
            ...baseValues,
            url: monitor.target,
          } as HTTPFormValues)
          break
        case 'ping':
          form.reset({
            ...baseValues,
            host: monitor.target,
          } as PingFormValues)
          break
        case 'port':
          form.reset({
            ...baseValues,
            host: monitor.target,
            port: monitor.port || 80,
            port_name: monitor.port_name || '',
          } as PortFormValues)
          break
        case 'dns':
          form.reset({
            ...baseValues,
            hostname: monitor.target,
            dns_server: monitor.dns_server || '',
            record_type: monitor.record_type || 'A',
            expected_value: monitor.expected_value || '',
          } as DNSFormValues)
          break
      }
    }
  }, [monitor, open, form])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setTags([])
      form.reset()
    }
  }, [open, form])

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags)
    form.setValue('tags', newTags)
  }

  const handlePortSelect = (portName: string) => {
    const portOption = TCP_PORT_OPTIONS.find((p) => p.name === portName)
    if (portOption) {
      form.setValue('port' as any, portOption.port)
      form.setValue('port_name' as any, portOption.name)
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (!monitor) return

    setIsSubmitting(true)
    try {
      await apiClient.patch(`/monitors/${monitor.id}`, {
        ...data,
        tags,
      })

      toast({
        title: 'Monitor updated',
        description: `${monitor.friendly_name} has been updated successfully.`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update monitor',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!monitor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Monitor</DialogTitle>
          <DialogDescription>
            Update the configuration for this monitor.
          </DialogDescription>
        </DialogHeader>

        {/* Monitor Type Display (read-only) */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Monitor Type</Label>
          <MonitorTypeDisplay type={monitorType} />
          <p className="text-xs text-muted-foreground">
            Monitor type cannot be changed after creation.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type-specific fields */}
            {monitorType === 'http' && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL to monitor *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the full URL including http:// or https://
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {monitorType === 'ping' && (
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP or host to monitor *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="192.168.1.1 or example.com"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter an IP address or hostname
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {monitorType === 'port' && (
              <>
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL, IP or host to monitor *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="192.168.1.1 or example.com"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>TCP Port *</FormLabel>
                  <Select onValueChange={handlePortSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a port" />
                    </SelectTrigger>
                    <SelectContent>
                      {TCP_PORT_OPTIONS.map((option) => (
                        <SelectItem key={option.name} value={option.name}>
                          {option.name} - {option.port}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a common port or enter a custom one below
                  </FormDescription>
                </FormItem>
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Port</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="8080"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {monitorType === 'dns' && (
              <>
                <FormField
                  control={form.control}
                  name="hostname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hostname to resolve *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example.com"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="record_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Record Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || 'A'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select record type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DNS_RECORD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dns_server"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNS Server (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="8.8.8.8 (uses default if empty)"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Specify a DNS server to query, or leave empty for default
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expected_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Value (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="93.184.216.34"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Expected DNS response value to verify
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Common fields */}
            <FormField
              control={form.control}
              name="friendly_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friendly Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Website Monitor"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this monitor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput
                value={tags}
                onChange={handleTagsChange}
                placeholder="Select or add tags..."
              />
            </div>

            {/* Email notification */}
            <FormField
              control={form.control}
              name="notify_email"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Email notifications</FormLabel>
                    <FormDescription>
                      Get notified via email at {auth.user?.email || 'your email'} when
                      this monitor goes down
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Monitor interval */}
            <FormField
              control={form.control}
              name="check_interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monitor Interval</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || '5m'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INTERVAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How often to check this monitor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
