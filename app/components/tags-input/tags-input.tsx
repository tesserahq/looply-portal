import { X } from 'lucide-react'
import { type KeyboardEvent, useState } from 'react'

import { Badge } from '@shadcn/ui/badge'
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
    const newTags = raw
      .split(/[\s,]+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)

    const deduped = [...value]
    for (const tag of newTags) {
      if (!deduped.includes(tag)) deduped.push(tag)
    }

    if (deduped.length !== value.length) onChange(deduped)
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
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
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled}
        className="placeholder:text-muted-foreground min-w-[2ch] flex-1 border-0 bg-transparent p-0
          text-base outline-none placeholder:opacity-50 disabled:cursor-not-allowed md:text-sm"
      />
    </div>
  )
}
