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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'
import { ObservabilityAsset } from '../types'
import { Activity, CircleCheck, Loader2 } from 'lucide-react'

// ==================== SCHEMAS ====================

// Base schema with common fields
const baseMonitorSchema = z.object({
  target: z
    .string()
    .min(1, 'Target is required')
    .refine(
      (val) => {
        // Basic IP or hostname validation
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
        const hostnameRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/
        return ipRegex.test(val) || hostnameRegex.test(val) || val.length >= 2
      },
      { message: 'Enter a valid IP address or hostname' }
    ),
  target_type: z.enum(['ip', 'hostname']),
  port: z
    .union([z.number().int().min(1).max(65535), z.literal(''), z.undefined()])
    .optional()
    .transform((val) => (val === '' || val === undefined ? undefined : val)),
})

// Performance monitor schema
const performanceMonitorSchema = baseMonitorSchema.extend({
  monitor_type: z.literal('performance'),
  protocol: z.enum(['icmp', 'http', 'https']),
  check_interval: z.enum(['60', '300', '900']).transform(Number),
})

// Availability monitor schema
const availabilityMonitorSchema = baseMonitorSchema.extend({
  monitor_type: z.literal('availability'),
  circuit_type: z.enum(['dia', 'broadband']),
  check_interval: z.enum(['30', '60', '300', '900']).transform(Number),
})

// Combined schema using discriminated union
const monitorFormSchema = z.discriminatedUnion('monitor_type', [
  performanceMonitorSchema,
  availabilityMonitorSchema,
])

type MonitorFormValues = z.infer<typeof monitorFormSchema>

// ==================== COMPONENT ====================

interface AddMonitorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: ObservabilityAsset | null
  onSuccess?: (assetId: string) => void
}

// Interval options
const performanceIntervals = [
  { value: '60', label: '1 minute' },
  { value: '300', label: '5 minutes' },
  { value: '900', label: '15 minutes' },
]

const availabilityIntervals = [
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '300', label: '5 minutes' },
  { value: '900', label: '15 minutes' },
]

export function AddMonitorDialog({
  open,
  onOpenChange,
  asset,
  onSuccess,
}: AddMonitorDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [monitorType, setMonitorType] = useState<'performance' | 'availability'>(
    'availability'
  )

  const form = useForm<MonitorFormValues>({
    resolver: zodResolver(monitorFormSchema),
    defaultValues: {
      monitor_type: 'availability',
      target: '',
      target_type: 'ip',
      port: undefined,
      circuit_type: 'broadband',
      check_interval: '60',
    } as any,
  })

  // Reset form when dialog opens or monitor type changes
  useEffect(() => {
    if (open) {
      const defaults =
        monitorType === 'performance'
          ? {
              monitor_type: 'performance' as const,
              target: '',
              target_type: 'ip' as const,
              port: undefined,
              protocol: 'icmp' as const,
              check_interval: '300',
            }
          : {
              monitor_type: 'availability' as const,
              target: '',
              target_type: 'ip' as const,
              port: undefined,
              circuit_type: 'broadband' as const,
              check_interval: '60',
            }
      form.reset(defaults as any)
    }
  }, [open, monitorType, form])

  const handleMonitorTypeChange = (value: 'performance' | 'availability') => {
    setMonitorType(value)
  }

  const onSubmit = async (values: MonitorFormValues) => {
    if (!asset) return

    setIsLoading(true)
    try {
      // Build the payload based on monitor type
      const payload: Record<string, unknown> = {
        target: values.target,
        target_type: values.target_type,
        check_interval: values.check_interval,
      }

      // Add port if provided
      if (values.port) {
        payload.port = values.port
      }

      // Add type-specific fields
      if (values.monitor_type === 'performance') {
        payload.protocol = values.protocol
      } else {
        payload.circuit_type = values.circuit_type
      }

      // Call the correct endpoint based on monitor type
      const endpoint =
        values.monitor_type === 'availability'
          ? `/assets/${asset.id}/monitors/availability`
          : `/assets/${asset.id}/monitors/performance`

      await apiClient.post(endpoint, payload)

      toast({
        title: 'Monitor created',
        description: `Successfully added ${values.monitor_type} monitor for ${asset.name}`,
      })

      // Reset and close
      form.reset()
      setMonitorType('availability')
      onOpenChange(false)
      
      // Trigger success callback with asset ID to expand the row
      onSuccess?.(asset.id)
    } catch (error: any) {
      console.error('Failed to create monitor:', error)
      const errorMessage =
        error?.response?.data?.detail || 'Failed to create monitor'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setMonitorType('availability')
    onOpenChange(false)
  }

  // Auto-detect target type based on input
  const handleTargetChange = (value: string) => {
    const ipRegex = /^(\d{1,3}\.){0,3}\d{0,3}$/
    if (ipRegex.test(value) || /^\d/.test(value)) {
      form.setValue('target_type', 'ip')
    } else if (value.length > 0) {
      form.setValue('target_type', 'hostname')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Monitor</DialogTitle>
          <DialogDescription>
            Add a new monitor to track{' '}
            <span className="font-medium">{asset?.name || 'the asset'}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Monitor Type Selection */}
            <FormField
              control={form.control}
              name="monitor_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monitor Type</FormLabel>
                  <Select
                    value={monitorType}
                    onValueChange={(value: 'performance' | 'availability') => {
                      field.onChange(value)
                      handleMonitorTypeChange(value)
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select monitor type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="availability">
                        <div className="flex items-center gap-2">
                          <CircleCheck className="h-4 w-4 text-green-500" />
                          <div className="flex flex-col items-start">
                            <span>Availability</span>
                            <span className="text-xs text-muted-foreground">
                              Track uptime, response time, packet loss
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="performance">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <div className="flex flex-col items-start">
                            <span>Performance</span>
                            <span className="text-xs text-muted-foreground">
                              Track CPU, memory, disk I/O, latency
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Input */}
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 192.168.1.1 or server.example.com"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        handleTargetChange(e.target.value)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    IP address or hostname to monitor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Type */}
            <FormField
              control={form.control}
              name="target_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ip" id="target-ip" />
                        <Label htmlFor="target-ip" className="cursor-pointer">
                          IP Address
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hostname" id="target-hostname" />
                        <Label
                          htmlFor="target-hostname"
                          className="cursor-pointer"
                        >
                          Hostname
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Port (Optional) */}
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Port <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 80, 443, 22"
                      min={1}
                      max={65535}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val === '' ? undefined : parseInt(val, 10))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Performance-specific: Protocol */}
            {monitorType === 'performance' && (
              <FormField
                control={form.control}
                name="protocol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select protocol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="icmp">
                          <div className="flex flex-col items-start">
                            <span>ICMP (Ping)</span>
                            <span className="text-xs text-muted-foreground">
                              Basic connectivity check
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="http">
                          <div className="flex flex-col items-start">
                            <span>HTTP</span>
                            <span className="text-xs text-muted-foreground">
                              Web endpoint (port 80)
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="https">
                          <div className="flex flex-col items-start">
                            <span>HTTPS</span>
                            <span className="text-xs text-muted-foreground">
                              Secure web endpoint (port 443)
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Availability-specific: Circuit Type */}
            {monitorType === 'availability' && (
              <FormField
                control={form.control}
                name="circuit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Circuit Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select circuit type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="broadband">
                          <div className="flex flex-col items-start">
                            <span>Broadband</span>
                            <span className="text-xs text-muted-foreground">
                              Consumer-grade connection
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dia">
                          <div className="flex flex-col items-start">
                            <span>DIA (Dedicated Internet Access)</span>
                            <span className="text-xs text-muted-foreground">
                              Enterprise-grade, higher SLA
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Check Interval */}
            <FormField
              control={form.control}
              name="check_interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Interval</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(monitorType === 'performance'
                        ? performanceIntervals
                        : availabilityIntervals
                      ).map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How often to check {monitorType === 'performance' ? 'metrics' : 'availability'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Monitor
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddMonitorDialog
