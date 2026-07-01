/**
 * Beacon Chatbot Feature
 *
 * AI-powered assistant for AssetWatch.
 * Provides a floating chat interface that can be added to any page.
 *
 * Usage:
 *   import { Beacon } from '@/features/beacon'
 *
 *   function App() {
 *     return (
 *       <div>
 *         <YourContent />
 *         <Beacon />
 *       </div>
 *     )
 *   }
 */

import { BeaconButton } from './components/beacon-button'
import { BeaconDialog } from './components/beacon-dialog'
import { useBeaconChat } from './hooks/use-beacon-chat'

/**
 * Beacon Component
 *
 * Renders a floating chat button and dialog.
 * Chat history is stored in memory only (clears on refresh).
 */
export function Beacon() {
  const {
    messages,
    isOpen,
    isLoading,
    sendMessage,
    clearMessages,
    toggleChat,
    closeChat,
  } = useBeaconChat()

  return (
    <>
      {/* Floating button */}
      <BeaconButton
        isOpen={isOpen}
        onClick={toggleChat}
        hasMessages={messages.length > 0 && !isOpen}
      />

      {/* Chat dialog */}
      <BeaconDialog
        isOpen={isOpen}
        onClose={closeChat}
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
        onClearMessages={clearMessages}
      />
    </>
  )
}

// Named exports for individual components if needed
export { BeaconButton } from './components/beacon-button'
export { BeaconDialog } from './components/beacon-dialog'
export { MessageBubble } from './components/message-bubble'
export { useBeaconChat } from './hooks/use-beacon-chat'
export type { ChatMessage, ChatRequest, ChatResponse } from './types'
