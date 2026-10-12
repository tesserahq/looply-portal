import { NodeENVType } from '@/libraries/fetch'
import { useLayouts } from '@/resources/hooks/layouts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shadcn/ui/select'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { useApp } from 'tessera-ui'

interface LayoutSelectProps {
  value?: string
  onChange: (layoutId: string) => void
  sendlyApiUrl: string
  nodeEnv: NodeENVType
  disabled?: boolean
}

/**
 * Picks the Sendly layout a campaign's body is wrapped in. Layouts live in
 * Sendly and are referenced by ID, never copied into the campaign.
 */
export function LayoutSelect({
  value,
  onChange,
  sendlyApiUrl,
  nodeEnv,
  disabled = false,
}: LayoutSelectProps) {
  const { token } = useApp()
  const sendlyConfig = { apiUrl: sendlyApiUrl, token: token!, nodeEnv }

  const { data: layouts, isLoading, isError } = useLayouts(sendlyConfig, { page: 1, size: 100 })

  const sortedLayouts = useMemo(
    () => [...(layouts?.items ?? [])].sort((a, b) => layoutLabel(a).localeCompare(layoutLabel(b))),
    [layouts]
  )

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        Couldn&apos;t load layouts. You may not have access to them.
      </p>
    )
  }

  return (
    <Select value={value ?? ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SelectValue placeholder="Choose a layout" />
        )}
      </SelectTrigger>
      <SelectContent>
        {sortedLayouts.map((layout) => (
          <SelectItem key={layout.id} value={layout.id}>
            {layoutLabel(layout)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function layoutLabel(layout: { name: string | null; alias: string }) {
  return layout.name || layout.alias
}
