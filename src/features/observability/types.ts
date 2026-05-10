/**
 * Observability Types
 * 
 * TypeScript interfaces for the observability feature.
 */

export interface MonitorSummary {
  total: number
  performance_count: number
  availability_count: number
  up_count: number
  down_count: number
  unknown_count: number
  active_count: number
  paused_count: number
}

export interface ObservabilityAsset {
  id: string
  name: string
  asset_type: string
  description?: string | null
  ip_address?: string | null
  serial_number?: string | null
  monitor_summary: MonitorSummary
  last_check_at?: string | null
  created_at: string
  updated_at: string
}

export interface MonitorDetail {
  id: string
  asset_id: string
  monitor_type: 'performance' | 'availability'
  target: string
  target_type: 'ip' | 'hostname'
  port?: number | null
  protocol?: string | null
  circuit_type?: string | null
  check_interval: number
  is_active: boolean
  current_status: 'up' | 'down' | 'unknown'
  last_check_at?: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedObservabilityResponse {
  data: ObservabilityAsset[]
  total: number
  page: number
  limit: number
  total_pages: number
}
