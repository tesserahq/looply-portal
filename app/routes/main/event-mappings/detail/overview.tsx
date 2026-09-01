import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import { useApp, DateTime } from 'tessera-ui'
import { ResourceID } from 'tessera-ui/components'
import { useDeleteEventMapping, useEventMappingDetail } from '@/resources/hooks/event-mappings'
import { ContactStatusBadge } from '@/components/contact-status/contact-status'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function EventMappingDetailOverview() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = { apiUrl: apiUrl!, nodeEnv, token: token! }

  const { data: eventMapping, isLoading } = useEventMappingDetail(
    config,
    params.event_mapping_id!,
    { enabled: !!params.event_mapping_id && !!token }
  )

  const { mutate: deleteEventMapping } = useDeleteEventMapping(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/event-mappings')
    },
  })

  const handleDelete = useCallback(() => {
    if (!eventMapping) return

    deleteModalRef.current?.open({
      title: 'Remove Event Mapping',
      description: `Looply will stop acting on "${eventMapping.event_type}" events - no more contacts resolved, events recorded, or field mappings applied for it. All of its field mappings are removed too. This action cannot be undone.`,
      onDelete: async () => {
        deleteModalRef.current?.updateConfig({ isLoading: true })
        await deleteEventMapping(eventMapping.id)
      },
    })
  }, [eventMapping, deleteEventMapping])

  if (isLoading) {
    return <AppPreloader />
  }

  if (!eventMapping) {
    return (
      <div className="animate-slide-up flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Event mapping not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-slide-up h-full">
      <div className="w-full lg:w-1/2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold lg:text-3xl">Overview</h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="px-0">
                    <EllipsisVertical size={18} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" side="left" className="w-40 p-2">
                  <Button
                    variant="ghost"
                    className="flex w-full justify-start gap-2"
                    onClick={() => navigate(`/event-mappings/${eventMapping.id}/edit`)}>
                    <Pencil size={18} />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="hover:bg-destructive hover:text-destructive-foreground flex w-full
                      justify-start gap-2"
                    onClick={handleDelete}>
                    <Trash2 size={18} />
                    <span>Delete</span>
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pt-4">
            <div className="d-list">
              <div className="d-item">
                <dt className="d-label">ID</dt>
                <dd className="d-content">
                  <ResourceID value={eventMapping.id} />
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Event Type</dt>
                <dd className="d-content">{eventMapping.event_type}</dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Source</dt>
                <dd className="d-content">
                  {eventMapping.source || <span className="text-muted-foreground">Unset</span>}
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Identity Field</dt>
                <dd className="d-content">
                  {eventMapping.identity_target_field || (
                    <span className="text-muted-foreground">
                      Not configured - events are dropped until set
                    </span>
                  )}
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Identity Source Path</dt>
                <dd className="d-content">
                  {eventMapping.identity_source_path || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Default Status</dt>
                <dd className="d-content">
                  {eventMapping.default_status ? (
                    <ContactStatusBadge status={eventMapping.default_status} />
                  ) : (
                    <span className="text-muted-foreground">Unset</span>
                  )}
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Default Tags</dt>
                <dd className="d-content">
                  {eventMapping.default_tags && eventMapping.default_tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {eventMapping.default_tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Created At</dt>
                <dd className="d-content">
                  {eventMapping.created_at ? <DateTime date={eventMapping.created_at} /> : 'N/A'}
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Updated At</dt>
                <dd className="d-content">
                  {eventMapping.updated_at ? <DateTime date={eventMapping.updated_at} /> : 'N/A'}
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmation ref={deleteModalRef} />
    </div>
  )
}
