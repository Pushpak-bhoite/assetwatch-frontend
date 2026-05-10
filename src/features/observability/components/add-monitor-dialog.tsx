import { useState } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'
import { ObservabilityAsset } from '../types'
import { Activity, CircleCheck, Loader2 } from 'lucide-react'

const monitorFormSchema = z.object({
  monitor_type: z.enum(['performance', 'availability']),
  target: z.string().min(1, 'Target is required'),
  protocol: z.string().optional(),
  circuit_type: z.string().optional(),
  check_interval: z.number().min(30, 'Minimum 30 seconds').max(86400, 'Maximum 24 hours'),
  threshold_warning: z.number().optional(),
  threshold_critical: z.number().optional(),
})

type MonitorFormValues = z.infer<typeof monitorFormSchema>

interface AddMonitorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: ObservabilityAsset | null
  onSuccess?: () => void
}

const protocols = ['ICMP', 'TCP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'SNMP']
const circuitTypes = ['fiber', 'copper', 'wireless', 'satellite', 'vpn', 'mpls']

export function AddMonitorDialog({
  open,
  onOpenChange,
  asset,
  onSuccess,
}: AddMonitorDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<MonitorFormValues>({
    resolver: zodResolver(monitorFormSchema),
    defaultValues: {
      monitor_type: 'availability',
      target: '',
      protocol: 'ICMP',
      check_interval: 60,
    },
  })

  const monitorType = form.watch('monitor_type')

  const onSubmit = async (values: MonitorFormValues) => {
    if (!asset) return

    setIsLoading(true)
    try {
      // Build the payload based on monitor type
      const payload: Record<string, unknown> = {
        asset_id: asset.id,
        target: values.target,
        check_interval: values.check_interval,
        is_active: true,
      }

      if (values.monitor_type === 'availability') {
        payload.protocol = values.protocol
      } else {
        payload.circuit_type = values.circuit_type || 'fiber'
        if (values.threshold_warning) {
          payload.threshold_warning = values.threshold_warning
        }
        if (values.threshold_critical) {
          payload.threshold_critical = values.threshold_critical
        }
      }

      const endpoint =
        values.monitor_type === 'availability'
          ? `/assets/${asset.id}/monitors/availability`
          : `/assets/${asset.id}/monitors/performance`

      await apiClient.post(endpoint, payload)

      toast({
        title: 'Monitor created',
        description: `Successfully added ${values.monitor_type} monitor for ${asset.name}`,
      })

      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Failed to create monitor:', error)
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to create monitor',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Monitor</DialogTitle>
          <DialogDescription>
            Add a new monitor to track {asset?.name || 'the asset'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Monitor Type */}
            <FormField
              control={form.control}
              name="monitor_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monitor Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                          Availability
                        </div>
                      </SelectItem>
                      <SelectItem value="performance">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          Performance
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target */}
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        monitorType === 'availability'
                          ? 'IP address or hostname (e.g., 192.168.1.1)'
                          : 'Endpoint or circuit ID'
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Protocol (for availability) */}
            {monitorType === 'availability' && (
              <FormField
                control={form.control}
                name="protocol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select protocol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {protocols.map((protocol) => (
                          <SelectItem key={protocol} value={protocol}>
                            {protocol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Circuit Type (for performance) */}
            {monitorType === 'performance' && (
              <>
                <FormField
                  control={form.control}
                  name="circuit_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Circuit Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || 'fiber'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select circuit type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {circuitTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Thresholds for performance monitors */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="threshold_warning"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warning Threshold (ms)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 100"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="threshold_critical"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Critical Threshold (ms)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 500"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Check Interval */}
            <FormField
              control={form.control}
              name="check_interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Interval (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="60"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 60)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
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
