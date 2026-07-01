/**
 * Beacon Chat Hook
 *
 * Custom hook for managing chat state and API calls.
 * Uses React Query for API communication.
 */

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { ChatMessage, ChatRequest, ChatResponse } from '../types'

// Generate unique ID for messages
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * Hook for managing Beacon chat functionality
 */
export function useBeaconChat() {
  // Chat messages state (in-memory only - clears on refresh)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (request: ChatRequest): Promise<ChatResponse> => {
      const response = await apiClient.post<ChatResponse>('/beacon/chat', request)
      return response.data
    },
  })

  /**
   * Send a message to Beacon
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      // Add user message to state
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Prepare history for API (last 10 messages)
      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      try {
        // Send to API
        const response = await sendMessageMutation.mutateAsync({
          message: content.trim(),
          history,
        })

        // Add assistant response to state
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        // Add error message
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content:
            'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    },
    [messages, sendMessageMutation]
  )

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  /**
   * Open chat dialog
   */
  const openChat = useCallback(() => {
    setIsOpen(true)
  }, [])

  /**
   * Close chat dialog
   */
  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  /**
   * Toggle chat dialog
   */
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return {
    // State
    messages,
    isOpen,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error,

    // Actions
    sendMessage,
    clearMessages,
    openChat,
    closeChat,
    toggleChat,
  }
}
