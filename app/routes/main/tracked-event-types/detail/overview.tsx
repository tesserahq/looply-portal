import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import { useApp, DateTime } from 'tessera-ui'
import { ResourceID } from 'tessera-ui/components'
import {
  useDeleteTrackedEventType,
  useTrackedEventTypeDetail,
} from '@/resources/hooks/tracked-event-types'
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

export default function TrackedEventTypeDetailOverview() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = { apiUrl: apiUrl!, nodeEnv, token: token! }

  const { data: tracked, isLoading } = useTrackedEventTypeDetail(
    config,
    params.tracked_event_type_id!,
    { enabled: !!params.tracked_event_type_id && !!token }
  )

  const { mutate: deleteTracked } = useDeleteTrackedEventType(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/tracked-event-types')
    },
  })

  const handleDelete = useCallback(() => {
    if (!tracked) return

    deleteModalRef.current?.open({
      title: 'Stop Tracking Event Type',
      description: `Looply will stop acting on "${tracked.event_type}" events - no more contacts resolved, events recorded, or field mappings applied for it. This action cannot be undone.`,
      onDelete: async () => {
        deleteModalRef.current?.updateConfig({ isLoading: true })
        await deleteTracked(tracked.id)
      },
    })
  }, [tracked, deleteTracked])

  if (isLoading) {
    return <AppPreloader />
  }

  if (!tracked) {
    return (
      <div className="animate-slide-up flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Tracked event type not found</p>
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
                  <ResourceID value={tracked.id} />
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Event Type</dt>
                <dd className="d-content">{tracked.event_type}</dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Created At</dt>
                <dd className="d-content">
                  {tracked.created_at ? <DateTime date={tracked.created_at} /> : 'N/A'}
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Updated At</dt>
                <dd className="d-content">
                  {tracked.updated_at ? <DateTime date={tracked.updated_at} /> : 'N/A'}
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
