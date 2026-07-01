/**
 * Beacon Chat Dialog
 *
 * The main chat interface that displays messages and input.
 */

import { useRef, useEffect, useState, KeyboardEvent } from 'react'
import {
  IconSend,
  IconTrash,
  IconX,
  IconRobot,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './message-bubble'
import type { ChatMessage } from '../types'

interface BeaconDialogProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  isLoading: boolean
  onSendMessage: (message: string) => void
  onClearMessages: () => void
}

export function BeaconDialog({
  isOpen,
  onClose,
  messages,
  isLoading,
  onSendMessage,
  onClearMessages,
}: BeaconDialogProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle send message
  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input)
      setInput('')
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] rounded-2xl border bg-background shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-200'>
      {/* Header */}
      <div className='flex items-center justify-between border-b px-4 py-3'>
        <div className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary'>
            <IconRobot className='h-5 w-5 text-primary-foreground' />
          </div>
          <div>
            <h3 className='font-semibold text-sm'>Beacon</h3>
            <p className='text-[10px] text-muted-foreground'>
              AssetWatch Assistant
            </p>
          </div>
        </div>
        <div className='flex items-center gap-1'>
          {messages.length > 0 && (
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={onClearMessages}
              title='Clear chat'
            >
              <IconTrash className='h-4 w-4' />
            </Button>
          )}
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={onClose}
          >
            <IconX className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className='h-[350px] px-4' ref={scrollRef}>
        <div className='flex flex-col gap-4 py-4'>
          {messages.length === 0 ? (
            // Welcome message
            <div className='flex flex-col items-center justify-center h-[300px] text-center px-4'>
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4'>
                <IconRobot className='h-8 w-8 text-primary' />
              </div>
              <h4 className='font-semibold mb-2'>Hi, I'm Beacon!</h4>
              <p className='text-sm text-muted-foreground'>
                I can help you with AssetWatch - ask me about your assets,
                monitors, or how to use the platform.
              </p>
              <div className='flex flex-wrap gap-2 mt-4 justify-center'>
                {[
                  'How many assets do I have?',
                  'What is a Performance Monitor?',
                  'Show my dashboard stats',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion)
                      inputRef.current?.focus()
                    }}
                    className='text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors'
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Message list
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className='flex gap-3 mr-auto max-w-[85%]'>
              <div className='h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0'>
                <IconRobot className='h-4 w-4' />
              </div>
              <div className='bg-muted rounded-2xl rounded-bl-md px-4 py-3'>
                <div className='flex gap-1'>
                  <span className='w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]' />
                  <span className='w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]' />
                  <span className='w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce' />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className='border-t p-3'>
        <div className='flex gap-2'>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Ask Beacon...'
            className='flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 max-h-[100px] min-h-[44px]'
            rows={1}
            disabled={isLoading}
          />
          <Button
            size='icon'
            className='h-[44px] w-[44px] rounded-xl shrink-0'
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <IconSend className='h-5 w-5' />
          </Button>
        </div>
        <p className='text-[10px] text-center text-muted-foreground mt-2'>
          Beacon can help with AssetWatch questions only
        </p>
      </div>
    </div>
  )
}
