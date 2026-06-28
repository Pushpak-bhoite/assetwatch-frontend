/**
 * Tag Input Component
 *
 * A combobox-style input for selecting and creating tags.
 * Fetches available tags from the API and allows both selection and creation of new tags.
 */

import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function TagInput({
  value,
  onChange,
  placeholder = 'Select or add tags...',
  disabled = false,
}: TagInputProps) {
  const [open, setOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // Fetch available tags from API
  const fetchTags = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get<string[]>('/monitors/tags')
      setAvailableTags(response.data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      setAvailableTags([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch tags when popover opens
  useEffect(() => {
    if (open) {
      fetchTags()
    }
  }, [open, fetchTags])

  // Handle selecting an existing tag
  const handleSelectTag = (tag: string) => {
    if (value.includes(tag)) {
      // Remove tag if already selected
      onChange(value.filter((t) => t !== tag))
    } else {
      // Add tag
      onChange([...value, tag])
    }
  }

  // Handle adding a new tag
  const handleAddNewTag = () => {
    const trimmedTag = searchValue.trim()
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag])
      setSearchValue('')
    }
  }

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove))
  }

  // Check if search value can be added as a new tag
  const canAddNewTag =
    searchValue.trim() &&
    !value.includes(searchValue.trim()) &&
    !availableTags.includes(searchValue.trim())

  // Filter tags based on search
  const filteredTags = availableTags.filter((tag) =>
    tag.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate text-muted-foreground">
              {value.length > 0
                ? `${value.length} tag${value.length > 1 ? 's' : ''} selected`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or create tag..."
              value={searchValue}
              onValueChange={setSearchValue}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canAddNewTag) {
                  e.preventDefault()
                  handleAddNewTag()
                }
              }}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading tags...
                  </span>
                </div>
              ) : (
                <>
                  {/* Add new tag option */}
                  {canAddNewTag && (
                    <>
                      <CommandGroup heading="Create new">
                        <CommandItem
                          onSelect={handleAddNewTag}
                          className="cursor-pointer"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          <span>
                            Create &quot;{searchValue.trim()}&quot;
                          </span>
                        </CommandItem>
                      </CommandGroup>
                      {filteredTags.length > 0 && <CommandSeparator />}
                    </>
                  )}

                  {/* Existing tags */}
                  {filteredTags.length > 0 ? (
                    <CommandGroup heading="Available tags">
                      {filteredTags.map((tag) => (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => handleSelectTag(tag)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              value.includes(tag) ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {tag}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    !canAddNewTag && (
                      <CommandEmpty>
                        {searchValue
                          ? 'No matching tags found'
                          : 'No tags available. Type to create one.'}
                      </CommandEmpty>
                    )
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
                disabled={disabled}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
