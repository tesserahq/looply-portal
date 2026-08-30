import { useApp } from 'tessera-ui'
import { NodeENVType } from '@/libraries/fetch'
import { Button } from '@/modules/shadcn/ui/button'
import { Dialog, DialogContent } from '@/modules/shadcn/ui/dialog'
import { Input } from '@/modules/shadcn/ui/input'
import { useSegments } from '@/resources/hooks/segments'
import { summarizeSegmentRuleShape } from '@/resources/queries/segments'
import { cn } from '@shadcn/lib/utils'
import { type DialogProps } from '@radix-ui/react-dialog'
import { ChevronsUpDownIcon, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

export interface SegmentOption {
  id: string
  name: string
}

export interface SegmentSelectProps {
  value?: string
  onChange: (segment: SegmentOption | undefined) => void
  apiUrl: string
  nodeEnv: NodeENVType
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  dialogProps?: DialogProps
}

export const SegmentSelect = ({
  value,
  onChange,
  apiUrl,
  nodeEnv,
  placeholder = 'Select a segment',
  searchPlaceholder = 'Search segments...',
  emptyText = 'No segments found.',
  disabled = false,
  dialogProps,
}: SegmentSelectProps) => {
  const { token } = useApp()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: segments, isLoading } = useSegments(
    { apiUrl, token: token!, nodeEnv },
    { page: 1, size: 100 },
    { enabled: open || value !== '' }
  )

  const segmentOptions = useMemo(() => {
    return (
      segments?.items.map((segment) => ({
        id: segment.id,
        name: segment.name,
        summary: summarizeSegmentRuleShape(segment.rule.root),
      })) || []
    )
  }, [segments])

  const selectedSegment = segmentOptions.find((segment) => segment.id === value)

  // Keeps the parent's copy of the selected segment (currently just the
  // name) in sync with what this component fetched - covers the initial
  // hydration where the parent only knows the id from `value`.
  useEffect(() => {
    if (value && selectedSegment) {
      onChange(selectedSegment)
    }
  }, [value, selectedSegment?.id, selectedSegment?.name])

  const handleSelect = (segmentId: string) => {
    if (segmentId === value) {
      onChange(undefined)
    } else {
      onChange(segmentOptions.find((segment) => segment.id === segmentId))
    }
    setOpen(false)
  }

  const filteredSegments = useMemo(() => {
    if (!search) return segmentOptions
    const searchLower = search.toLowerCase()
    return segmentOptions.filter((segment) => segment.name.toLowerCase().includes(searchLower))
  }, [segmentOptions, search])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) setSearch('')
  }

  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        type="button"
        aria-expanded={open}
        disabled={isLoading || disabled}
        onClick={() => setOpen(true)}
        className="w-full justify-between rounded bg-transparent">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : selectedSegment ? (
          <div className="truncate">
            <span className="truncate font-medium">{selectedSegment.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground truncate">{placeholder}</span>
        )}
        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange} {...dialogProps}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <div className="flex h-full flex-col">
            <div className="flex items-center border-b px-3">
              <Search className="mr-1 h-4 w-4 shrink-0 opacity-50" />
              <Input
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 border-0 bg-transparent outline-none focus-visible:ring-0
                  focus-visible:ring-offset-0"
                autoFocus
              />
            </div>

            <div className="max-h-[300px] overflow-x-hidden overflow-y-auto p-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={30} className="shrink-0 animate-spin opacity-50" />
                </div>
              ) : filteredSegments.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">{emptyText}</div>
              ) : (
                <div className="space-y-1">
                  {filteredSegments.map((segment) => {
                    const isSelected = value === segment.id

                    return (
                      <div
                        key={segment.id}
                        onClick={() => handleSelect(segment.id)}
                        className={cn(
                          `dark:hover:bg-navy-300/20 relative flex cursor-pointer items-center gap-2
                            rounded-sm py-2 ps-4 pe-2 text-sm outline-none select-none
                            hover:bg-slate-300/20`,
                          isSelected && 'border-primary bg-accent hover:bg-accent border'
                        )}>
                        <div className="flex flex-1 flex-col truncate">
                          <span className="truncate font-medium">{segment.name}</span>
                          <span className="text-muted-foreground truncate text-xs">
                            {segment.summary}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
