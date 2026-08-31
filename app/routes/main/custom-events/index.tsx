import { DataTable } from '@/components/data-table'
import EmptyContent from '@/components/empty-content/empty-content'
import { ApiErrorOverlay } from '@/components/misc/api-error-overlay'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useCustomEvents } from '@/resources/hooks/custom-events'
import { CustomEventType } from '@/resources/queries/custom-events'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { Link, useLoaderData } from 'react-router'
import { ResourceID, useApp, DateTime } from 'tessera-ui'

export async function loader({ request }: LoaderFunctionArgs) {
  const canonical = ensureCanonicalPagination(request, {
    defaultSize: 25,
    defaultPage: 1,
  })

  if (canonical instanceof Response) return canonical

  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv, size: canonical.size, page: canonical.page }
}

export default function CustomEvents() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const { data, isLoading, apiError } = useCustomEvents(config, { page, size })

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const columns: ColumnDef<CustomEventType>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Event Type',
        size: 260,
        cell: ({ row }) => (
          <Link to={`/custom-events/${row.original.id}`} className="button-link">
            <span className="text-sm font-medium">{row.original.name}</span>
          </Link>
        ),
      },
      {
        accessorKey: 'contact_id',
        header: 'Contact',
        size: 20,
        cell: ({ row }) => <ResourceID value={row.original.contact_id} />,
      },
      {
        accessorKey: 'occurred_at',
        header: 'Occurred At',
        size: 180,
        cell: ({ row }) => {
          const { occurred_at } = row.original
          if (!occurred_at) return <span className="text-muted-foreground">-</span>
          return <DateTime date={occurred_at} />
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Ingested At',
        size: 180,
        cell: ({ row }) => {
          const { created_at } = row.original
          if (!created_at) return <span className="text-muted-foreground">-</span>
          return <DateTime date={created_at} />
        },
      },
      {
        accessorKey: 'id',
        header: 'ID',
        size: 20,
        cell: ({ row }) => <ResourceID value={row.original.id} />,
      },
    ],
    []
  )

  if (isLoading) {
    return <AppPreloader />
  }

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No custom events yet"
      description="Events ingested over NATS for a tracked event_type will appear here"
    />
  )

  return (
    <div className="page-content h-full">
      <div className="mb-5 animate-slide-up flex items-center justify-between">
        <h1 className="page-title">Custom Events</h1>
      </div>
      <div className="animate-slide-up">
        {apiError ? (
          <ApiErrorOverlay
            statusCode={apiError?.statusCode ?? 403}
            message={apiError?.message ?? 'Access denied.'}
            rawMessage={apiError?.rawMessage}
          />
        ) : !hasData ? (
          emptyContent
        ) : (
          <DataTable
            columns={columns}
            data={data?.items || []}
            meta={{
              page: data?.page || 1,
              pages: data?.pages || 1,
              size: data?.size || 1,
              total: data?.total || 0,
            }}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}
