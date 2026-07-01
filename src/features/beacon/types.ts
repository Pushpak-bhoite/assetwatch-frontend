/**
 * Beacon Chatbot - TypeScript Types
 */

// Chat message interface
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// API request interface
export interface ChatRequest {
  message: string
  history?: {
    role: string
    content: string
  }[]
}

// API response interface
export interface ChatResponse {
  response: string
}

// Health check response
export interface BeaconHealthResponse {
  status: 'available' | 'unavailable'
  message: string
}
