import { AppPreloader } from '@/components/loader/pre-loader'
import { JsonEditor } from '@/components/json/editor'
import { useApp, DateTime } from 'tessera-ui'
import { ResourceID } from 'tessera-ui/components'
import { useCustomEventDetail } from '@/resources/hooks/custom-events'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Link, useLoaderData, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function CustomEventDetailOverview() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const params = useParams()

  const config = { apiUrl: apiUrl!, nodeEnv, token: token! }

  const { data: event, isLoading } = useCustomEventDetail(config, params.event_id!, {
    enabled: !!params.event_id && !!token,
  })

  if (isLoading) {
    return <AppPreloader />
  }

  if (!event) {
    return (
      <div className="animate-slide-up flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Custom event not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-slide-up flex h-full flex-col gap-4">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold lg:text-3xl">Overview</h1>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pt-4">
          <div className="d-list">
            <div className="d-item">
              <dt className="d-label">ID</dt>
              <dd className="d-content">
                <ResourceID value={event.id} />
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Event Type</dt>
              <dd className="d-content">{event.name}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Contact</dt>
              <dd className="d-content">
                <Link to={`/contacts/${event.contact_id}/overview`} className="button-link">
                  <ResourceID value={event.contact_id} />
                </Link>
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Occurred At</dt>
              <dd className="d-content">
                <DateTime date={event.occurred_at} />
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Ingested At</dt>
              <dd className="d-content">
                <DateTime date={event.created_at} />
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <JsonEditor initialValue={event.properties} readOnly />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Envelope</CardTitle>
        </CardHeader>
        <CardContent>
          <JsonEditor initialValue={event.raw_envelope} readOnly />
        </CardContent>
      </Card>
    </div>
  )
}
