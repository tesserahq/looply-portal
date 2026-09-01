import { useApp } from 'tessera-ui'
import { NodeENVType } from '@/libraries/fetch'
import { Button } from '@/modules/shadcn/ui/button'
import { Dialog, DialogContent } from '@/modules/shadcn/ui/dialog'
import { Input } from '@/modules/shadcn/ui/input'
import { Checkbox } from '@/modules/shadcn/ui/checkbox'
import { useTags } from '@/resources/hooks/tags'
import { cn } from '@shadcn/lib/utils'
import { type DialogProps } from '@radix-ui/react-dialog'
import { ChevronsUpDownIcon, Loader2, Search } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

export interface TagMultiSelectProps {
  /** Selected tag ids - ANY-of (OR) semantics, matches the backend's
   * TagMembershipCondition. */
  value: string[]
  onChange: (tagIds: string[]) => void
  apiUrl: string
  nodeEnv: NodeENVType
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  dialogProps?: DialogProps
}

export const TagMultiSelect = ({
  value,
  onChange,
  apiUrl,
  nodeEnv,
  placeholder = 'Select tags',
  searchPlaceholder = 'Search tags...',
  emptyText = 'No tags found.',
  disabled = false,
  dialogProps,
}: TagMultiSelectProps) => {
  const { token } = useApp()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: tags, isLoading } = useTags(
    { apiUrl, token: token!, nodeEnv },
    { page: 1, size: 100 },
    { enabled: open || value.length > 0 }
  )

  const tagOptions = useMemo(() => tags?.items || [], [tags])
  const selectedTags = tagOptions.filter((tag) => value.includes(tag.id))

  const handleToggle = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId))
    } else {
      onChange([...value, tagId])
    }
  }

  const filteredTags = useMemo(() => {
    if (!search) return tagOptions
    const searchLower = search.toLowerCase()
    return tagOptions.filter((tag) => tag.name.toLowerCase().includes(searchLower))
  }, [tagOptions, search])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) setSearch('')
  }

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
        ) : selectedTags.length > 0 ? (
          <span className="truncate font-medium">
            {selectedTags.map((tag) => tag.name).join(', ')}
          </span>
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
              ) : filteredTags.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">{emptyText}</div>
              ) : (
                <div className="space-y-1">
                  {filteredTags.map((tag) => {
                    const isSelected = value.includes(tag.id)

                    return (
                      <div
                        key={tag.id}
                        onClick={() => handleToggle(tag.id)}
                        className={cn(
                          `dark:hover:bg-navy-300/20 relative flex cursor-pointer items-center gap-2
                            rounded-sm py-2 ps-4 pe-2 text-sm outline-none select-none
                            hover:bg-slate-300/20`,
                          isSelected && 'border-primary bg-accent hover:bg-accent border'
                        )}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(tag.id)}
                        />
                        <div className="flex flex-1 flex-col truncate">
                          <span className="truncate font-medium">{tag.name}</span>
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
