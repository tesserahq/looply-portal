import { DataTable } from '@/components/data-table'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import EmptyContent from '@/components/empty-content/empty-content'
import { ApiErrorOverlay } from '@/components/misc/api-error-overlay'
import { AppPreloader } from '@/components/loader/pre-loader'
import NewButton from '@/components/new-button/new-button'
import { useDeleteEventMapping, useEventMappings } from '@/resources/hooks/event-mappings'
import { EventMappingType } from '@/resources/queries/event-mappings'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import type { ColumnDef } from '@tanstack/react-table'
import { Ellipsis, EyeIcon, KeyRound, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { Link, useLoaderData, useNavigate } from 'react-router'
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

export default function EventMappings() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const { data, isLoading, apiError } = useEventMappings(config, { page, size })

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const { mutate: deleteEventMapping } = useDeleteEventMapping(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
    },
  })

  const handleDelete = useCallback(
    (eventMapping: EventMappingType) => {
      deleteModalRef.current?.open({
        title: 'Remove Event Mapping',
        description: `Looply will stop acting on "${eventMapping.event_type}" events - no more contacts resolved, events recorded, or field mappings applied for it. All of its field mappings are removed too. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteEventMapping(eventMapping.id)
        },
      })
    },
    [deleteEventMapping]
  )

  const columns: ColumnDef<EventMappingType>[] = useMemo(
    () => [
      {
        accessorKey: 'event_type',
        header: 'Event Type',
        size: 320,
        cell: ({ row }) => (
          <Link to={`/event-mappings/${row.original.id}`} className="button-link">
            <span className="text-sm font-medium">{row.original.event_type}</span>
          </Link>
        ),
      },
      {
        accessorKey: 'identity_target_field',
        header: 'Identity',
        size: 180,
        cell: ({ row }) => {
          const { identity_target_field } = row.original
          if (!identity_target_field) {
            return <Badge variant="outline">Not configured</Badge>
          }
          return (
            <span className="flex items-center gap-1.5 text-sm">
              <KeyRound size={12} className="text-muted-foreground shrink-0" />
              {identity_target_field}
            </span>
          )
        },
      },
      {
        accessorKey: 'source',
        header: 'Source',
        size: 150,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">{row.original.source || '-'}</span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: 100,
        cell: ({ row }) => {
          const { created_at } = row.original
          if (!created_at) return <span className="text-muted-foreground">-</span>
          return <DateTime date={created_at} formatStr="dd/MM/yyyy" />
        },
      },
      {
        accessorKey: 'id',
        header: 'ID',
        size: 20,
        cell: ({ row }) => <ResourceID value={row.original.id} />,
      },
      {
        accessorKey: 'id',
        header: '',
        size: 20,
        cell: ({ row }) => {
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="px-0">
                  <Ellipsis size={18} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="right" className="w-40 p-2">
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/event-mappings/${row.original.id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  className="hover:bg-destructive hover:text-destructive-foreground flex w-full
                    justify-start gap-2"
                  onClick={() => handleDelete(row.original)}>
                  <Trash2 size={18} />
                  <span>Delete</span>
                </Button>
              </PopoverContent>
            </Popover>
          )
        },
      },
    ],
    [handleDelete, navigate]
  )

  if (isLoading) {
    return <AppPreloader />
  }

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No event mappings"
      description="Looply ignores everything on the NATS stream until you register an event_type here">
      <Button variant="black" onClick={() => navigate('/event-mappings/new')}>
        Register Event Mapping
      </Button>
    </EmptyContent>
  )

  return (
    <div className="page-content h-full">
      <div className="mb-5 animate-slide-up flex items-center justify-between">
        <h1 className="page-title">Event Mappings</h1>
        {hasData && (
          <NewButton
            label="Register Event Mapping"
            onClick={() => navigate('/event-mappings/new')}
          />
        )}
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

      <DeleteConfirmation ref={deleteModalRef} />
    </div>
  )
}
