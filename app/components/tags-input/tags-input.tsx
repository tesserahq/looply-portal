import { X } from 'lucide-react'
import { type KeyboardEvent, useState } from 'react'

import { Badge } from '@shadcn/ui/badge'
import { Input } from '@shadcn/ui/input'
import { cn } from '@shadcn/lib/utils'

type TagsInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function TagsInput({
  value,
  onChange,
  placeholder = 'Add a tag',
  className,
  disabled,
}: TagsInputProps) {
  const [draft, setDraft] = useState('')

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase()
    if (!tag || value.includes(tag)) {
      setDraft('')
      return
    }
    onChange([...value, tag])
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
      return
    }
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div
      className={cn(
        `border-input focus-within:ring-primary flex w-full flex-wrap items-center gap-2 rounded
        border bg-transparent px-3 py-2 focus-within:ring-2 focus-within:ring-offset-2`,
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}>
      {value.map((tag) => (
        <Badge key={tag} variant="default" className="gap-1 font-medium">
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="hover:opacity-75 focus:outline-none">
              <X className="size-3" />
            </button>
          )}
        </Badge>
      ))}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled}
        className="h-auto w-auto min-w-[8ch] flex-1 border-0 p-0 focus-visible:ring-0
          focus-visible:ring-offset-0"
      />
    </div>
  )
}
