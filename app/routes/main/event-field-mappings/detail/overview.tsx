import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import { useApp, DateTime } from 'tessera-ui'
import { ResourceID } from 'tessera-ui/components'
import {
  useDeleteEventFieldMapping,
  useEventFieldMappingDetail,
} from '@/resources/hooks/event-field-mappings'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { EllipsisVertical, Trash2 } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function EventFieldMappingDetailOverview() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = { apiUrl: apiUrl!, nodeEnv, token: token! }

  const { data: mapping, isLoading } = useEventFieldMappingDetail(config, params.mapping_id!, {
    enabled: !!params.mapping_id && !!token,
  })

  const { mutate: deleteMapping } = useDeleteEventFieldMapping(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/event-field-mappings')
    },
  })

  const handleDelete = useCallback(() => {
    if (!mapping) return

    deleteModalRef.current?.open({
      title: 'Remove Event Field Mapping',
      description: `Newly ingested "${mapping.event_type}" events will stop updating "${mapping.field_name}". This action cannot be undone.`,
      onDelete: async () => {
        deleteModalRef.current?.updateConfig({ isLoading: true })
        await deleteMapping(mapping.id)
      },
    })
  }, [mapping, deleteMapping])

  if (isLoading) {
    return <AppPreloader />
  }

  if (!mapping) {
    return (
      <div className="animate-slide-up flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Event field mapping not found</p>
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
                  <ResourceID value={mapping.id} />
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Event Type</dt>
                <dd className="d-content">{mapping.event_type}</dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Source Path</dt>
                <dd className="d-content">{mapping.source_path}</dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Target Custom Field</dt>
                <dd className="d-content">{mapping.field_name}</dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Created At</dt>
                <dd className="d-content">
                  {mapping.created_at ? <DateTime date={mapping.created_at} /> : 'N/A'}
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Updated At</dt>
                <dd className="d-content">
                  {mapping.updated_at ? <DateTime date={mapping.updated_at} /> : 'N/A'}
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
