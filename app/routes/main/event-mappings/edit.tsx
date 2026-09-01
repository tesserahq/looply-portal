import { AppPreloader } from '@/components/loader/pre-loader'
import { Button } from '@/modules/shadcn/ui/button'
import { useApp } from 'tessera-ui'
import { TagsInput } from 'tessera-ui/components'
import { useEventMappingDetail, useUpdateEventMapping } from '@/resources/hooks/event-mappings'
import { useContactStatuses } from '@/resources/hooks/contacts'
import { IDENTITY_KEY_TARGETS } from '@/resources/queries/event-mappings'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Input } from '@/modules/shadcn/ui/input'
import { Label } from '@/modules/shadcn/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcn/ui/select'
import { Loader2 } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

const NONE_VALUE = '__none__'

export default function EventMappingEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { event_mapping_id } = useParams<{ event_mapping_id: string }>()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { data: eventMapping, isLoading } = useEventMappingDetail(config, event_mapping_id!, {
    enabled: !!event_mapping_id,
  })

  const [source, setSource] = useState('')
  const [identityTargetField, setIdentityTargetField] = useState('')
  const [identitySourcePath, setIdentitySourcePath] = useState('')
  const [defaultStatus, setDefaultStatus] = useState('')
  const [defaultTags, setDefaultTags] = useState<string[]>([])

  const { data: contactStatusesData, isLoading: isLoadingContactStatuses } = useContactStatuses(
    config,
    { enabled: !!config.token }
  )
  const contactStatusOptions = useMemo(
    () => contactStatusesData?.items || [],
    [contactStatusesData]
  )

  useEffect(() => {
    if (eventMapping) {
      setSource(eventMapping.source || '')
      setIdentityTargetField(eventMapping.identity_target_field || '')
      setIdentitySourcePath(eventMapping.identity_source_path || '')
      setDefaultStatus(eventMapping.default_status || '')
      setDefaultTags(eventMapping.default_tags || [])
    }
  }, [eventMapping])

  const { mutateAsync: updateEventMapping, isPending } = useUpdateEventMapping(config, {
    onSuccess: () => {
      navigate(`/event-mappings/${event_mapping_id}`)
    },
  })

  const identityIncomplete = Boolean(identityTargetField) !== Boolean(identitySourcePath)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (identityIncomplete) return

    await updateEventMapping({
      id: event_mapping_id!,
      updateData: {
        source: source || undefined,
        identity_target_field: identityTargetField || undefined,
        identity_source_path: identitySourcePath || undefined,
        default_status: defaultStatus || undefined,
        default_tags: defaultTags,
      },
    })
  }

  if (isLoading) {
    return <AppPreloader />
  }

  if (!eventMapping) {
    return null
  }

  return (
    <div className="animate-slide-up mx-auto w-full max-w-screen-md p-5">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event Mapping</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Input value={eventMapping.event_type} disabled />
              <p className="text-muted-foreground text-xs">
                Immutable once created - delete and recreate to change it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. linden"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Identity Field</Label>
              <Select
                value={identityTargetField || NONE_VALUE}
                onValueChange={(value) =>
                  setIdentityTargetField(value === NONE_VALUE ? '' : value)
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select an identity field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None yet - configure later</SelectItem>
                  {IDENTITY_KEY_TARGETS.map((target) => (
                    <SelectItem key={target} value={target}>
                      {target}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Which Contact column identifies the contact for this event_type. Without one, every
                event for this event_type is dropped.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identity_source_path">Identity Source Path</Label>
              <Input
                id="identity_source_path"
                value={identitySourcePath}
                onChange={(e) => setIdentitySourcePath(e.target.value)}
                placeholder="e.g. person.id"
              />
              {identityIncomplete && (
                <p className="text-destructive text-xs">
                  Identity Field and Identity Source Path must be set together, or both left blank.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Default Status</Label>
              <Select
                value={defaultStatus || NONE_VALUE}
                onValueChange={(value) => setDefaultStatus(value === NONE_VALUE ? '' : value)}
                disabled={isLoadingContactStatuses}>
                <SelectTrigger>
                  <SelectValue placeholder="Leave unset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Leave unset</SelectItem>
                  {contactStatusOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Stamped onto a contact auto-created from this event_type. Only applies on creation -
                never changes an existing contact matched by a later event.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Default Tags</Label>
              <TagsInput value={defaultTags} onChange={setDefaultTags} disabled={isPending} />
              <p className="text-muted-foreground text-xs">
                Stamped onto a contact auto-created from this event_type. Only applies on creation -
                never changes an existing contact matched by a later event.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(`/event-mappings/${event_mapping_id}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || identityIncomplete}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
