import { NodeENVType } from '@/libraries/fetch'
import { useContactCustomEvents } from '@/resources/hooks/custom-events'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Link } from 'react-router'
import { DateTime, useApp } from 'tessera-ui'

interface ContactCustomEventsCardProps {
  apiUrl: string
  nodeEnv: NodeENVType
  contactExternalId: string | null | undefined
}

export const ContactCustomEventsCard = ({
  apiUrl,
  nodeEnv,
  contactExternalId,
}: ContactCustomEventsCardProps) => {
  const { token } = useApp()
  const config = { apiUrl, token: token!, nodeEnv }

  const { data: events, isLoading } = useContactCustomEvents(config, contactExternalId || '', {
    enabled: !!contactExternalId,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event History</CardTitle>
      </CardHeader>
      <CardContent>
        {!contactExternalId ? (
          <p className="text-muted-foreground text-sm">
            This contact has no external host platform identity, so it can&apos;t be matched against
            ingested events.
          </p>
        ) : isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : !events || events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No events recorded for this contact.</p>
        ) : (
          <div className="d-list">
            {events.map((event) => (
              <div key={event.id} className="d-item">
                <dt className="d-label">
                  <Link to={`/custom-events/${event.id}`} className="button-link">
                    {event.name}
                  </Link>
                </dt>
                <dd className="d-content">
                  <DateTime date={event.occurred_at} />
                </dd>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
