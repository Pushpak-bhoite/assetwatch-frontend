/**
 * Monitoring Feature Types
 *
 * TypeScript interfaces for the Monitoring tab feature.
 */

// Monitor types supported
export type MonitorType = 'http' | 'ping' | 'port' | 'dns'

// Monitor status
export type MonitorStatus = 'up' | 'down' | 'unknown' | 'paused'

// Check interval options
export interface IntervalOption {
  value: string
  label: string
  seconds: number
}

export const INTERVAL_OPTIONS: IntervalOption[] = [
  { value: '30s', label: '30 seconds', seconds: 30 },
  { value: '1m', label: '1 minute', seconds: 60 },
  { value: '5m', label: '5 minutes', seconds: 300 },
  { value: '15m', label: '15 minutes', seconds: 900 },
  { value: '30m', label: '30 minutes', seconds: 1800 },
  { value: '1hr', label: '1 hour', seconds: 3600 },
  { value: '12hr', label: '12 hours', seconds: 43200 },
]

// TCP Port options for Port monitoring
export interface PortOption {
  name: string
  port: number
}

export const TCP_PORT_OPTIONS: PortOption[] = [
  { name: 'FTP', port: 21 },
  { name: 'SSH/SFTP', port: 22 },
  { name: 'SMTP', port: 25 },
  { name: 'DNS', port: 53 },
  { name: 'HTTP', port: 80 },
  { name: 'POP3', port: 110 },
  { name: 'IMAP', port: 143 },
  { name: 'HTTPS', port: 443 },
  { name: 'SMTP-SSL', port: 465 },
  { name: 'SMTP-TLS', port: 587 },
  { name: 'IMAP-SSL', port: 993 },
  { name: 'POP3-SSL', port: 995 },
  { name: 'MySQL', port: 3306 },
]

// DNS Record types
export const DNS_RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA']

// Monitor type descriptions
export const MONITOR_TYPE_INFO: Record<
  MonitorType,
  { title: string; description: string }
> = {
  http: {
    title: 'HTTP / website monitoring',
    description:
      'Use HTTP(S) monitor to monitor your website, API endpoint, or anything running on HTTP.',
  },
  ping: {
    title: 'Ping monitoring',
    description:
      'Make sure your server or any device in the network is always available.',
  },
  port: {
    title: 'Port monitoring',
    description:
      'Monitor any service on your server. Useful for SMTP, POP3, FTP, and other services running on specific TCP ports.',
  },
  dns: {
    title: 'DNS monitoring',
    description:
      'Monitor DNS servers and verify that DNS records resolve to expected values.',
  },
}

// Sparkline data point for response time visualization
export interface SparklinePoint {
  response_time: number | null  // null = failed/timeout
  status: 'up' | 'down'
  timestamp: string
}

// Monitor response interface
export interface Monitor {
  id: string
  user_id: string
  monitor_type: MonitorType
  friendly_name: string
  target: string
  tags: string[]
  notify_email: boolean
  check_interval: string
  check_interval_seconds: number
  is_active: boolean
  current_status: MonitorStatus
  last_check_at: string | null
  response_time: number | null
  uptime_percentage: number | null
  created_at: string
  updated_at: string
  // Type-specific fields
  port?: number | null
  port_name?: string | null
  dns_server?: string | null
  record_type?: string | null
  expected_value?: string | null
  // Sparkline data
  sparkline_data: SparklinePoint[]
  sparkline_period: string | null
}

// Paginated response
export interface PaginatedMonitorsResponse {
  data: Monitor[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// Monitor stats
export interface MonitorStats {
  total: number
  up: number
  down: number
  paused: number
  unknown: number
}

// Create monitor request types
export interface HTTPMonitorCreate {
  monitor_type: 'http'
  url: string
  friendly_name: string
  tags?: string[]
  notify_email?: boolean
  check_interval: string
}

export interface PingMonitorCreate {
  monitor_type: 'ping'
  host: string
  friendly_name: string
  tags?: string[]
  notify_email?: boolean
  check_interval: string
}

export interface PortMonitorCreate {
  monitor_type: 'port'
  host: string
  port: number
  port_name?: string
  friendly_name: string
  tags?: string[]
  notify_email?: boolean
  check_interval: string
}

export interface DNSMonitorCreate {
  monitor_type: 'dns'
  hostname: string
  dns_server?: string
  record_type?: string
  expected_value?: string
  friendly_name: string
  tags?: string[]
  notify_email?: boolean
  check_interval: string
}

export type MonitorCreateRequest =
  | HTTPMonitorCreate
  | PingMonitorCreate
  | PortMonitorCreate
  | DNSMonitorCreate


// ==================== MONITOR DETAILS PAGE TYPES ====================

// Incident response
export interface MonitorIncident {
  id: string
  monitor_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  error_message: string | null
  check_count: number
  is_resolved: boolean
}

// Hourly status point for 24-hour status dots
export interface HourlyStatusPoint {
  hour: number // 0-23
  timestamp: string
  status: 'up' | 'down' | 'partial' | 'no_data'
  uptime_percentage: number
  total_checks: number
  failed_checks: number
}

// 24-hour status summary
export interface HourlyStatusResponse {
  hours: HourlyStatusPoint[]
  total_incidents: number
  total_downtime_minutes: number
}

// Chart data point
export interface MetricsChartPoint {
  timestamp: string
  response_time: number | null
  status: 'up' | 'down'
}

// Chart response
export interface MetricsChartResponse {
  data: MetricsChartPoint[]
  range: '1h' | '24h' | '7d' | '30d'
  avg_response_time: number | null
  min_response_time: number | null
  max_response_time: number | null
  uptime_percentage: number
}

// Extended monitor details for details page
export interface MonitorDetail extends Omit<Monitor, 'sparkline_data' | 'sparkline_period'> {
  // 30-day stats
  uptime_percentage_30d: number
  avg_response_time_30d: number | null
  total_checks_30d: number
  total_incidents_30d: number
  // Current incident (if down)
  current_incident: MonitorIncident | null
  consecutive_failures: number
  // Last error
  last_error: string | null
}
