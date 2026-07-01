/**
 * Beacon Floating Button
 *
 * A floating action button that opens the Beacon chat dialog.
 */

import { IconRobot, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BeaconButtonProps {
  isOpen: boolean
  onClick: () => void
  hasMessages?: boolean
}

export function BeaconButton({ isOpen, onClick, hasMessages }: BeaconButtonProps) {
  return (
    <Button
      onClick={onClick}
      size='icon'
      className={cn(
        'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-200 hover:scale-105',
        isOpen && 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
    >
      {isOpen ? (
        <IconX className='h-6 w-6' />
      ) : (
        <>
          <IconRobot className='h-6 w-6' />
          {/* Notification dot when there are messages */}
          {hasMessages && (
            <span className='absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive animate-pulse' />
          )}
        </>
      )}
    </Button>
  )
}
