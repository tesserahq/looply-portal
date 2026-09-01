import { DataTable } from '@/components/data-table'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import NewButton from '@/components/new-button/new-button'
import {
  useDeleteEventFieldMapping,
  useEventFieldMappings,
} from '@/resources/hooks/event-field-mappings'
import { EventFieldMappingType } from '@/resources/queries/event-field-mappings'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import type { ColumnDef } from '@tanstack/react-table'
import { Ellipsis, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData, useNavigate, useParams } from 'react-router'
import { ResourceID, useApp } from 'tessera-ui'

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

export default function EventMappingDetailFields() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const eventMappingId = params.event_mapping_id!
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = { apiUrl: apiUrl!, nodeEnv, token: token! }

  const { data, isLoading } = useEventFieldMappings(config, eventMappingId, { page, size })

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const { mutate: deleteMapping } = useDeleteEventFieldMapping(config, eventMappingId, {
    onSuccess: () => {
      deleteModalRef.current?.close()
    },
  })

  const handleDelete = useCallback(
    (mapping: EventFieldMappingType) => {
      const target =
        mapping.target_type === 'contact_field' ? mapping.target_field : mapping.field_name
      deleteModalRef.current?.open({
        title: 'Remove Field Mapping',
        description: `Newly ingested events will stop updating "${target}". This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteMapping(mapping.id)
        },
      })
    },
    [deleteMapping]
  )

  const columns: ColumnDef<EventFieldMappingType>[] = useMemo(
    () => [
      {
        accessorKey: 'source_path',
        header: 'Source Path',
        size: 260,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.source_path}</span>,
      },
      {
        accessorKey: 'field_name',
        header: 'Target',
        size: 220,
        cell: ({ row }) => {
          const { target_type, target_field, field_name } = row.original
          return (
            <span className="text-muted-foreground text-sm">
              {target_type === 'contact_field'
                ? `Contact: ${target_field}`
                : `Custom: ${field_name}`}
            </span>
          )
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
                  onClick={() =>
                    navigate(`/event-mappings/${eventMappingId}/fields/${row.original.id}/edit`)
                  }>
                  <Pencil size={18} />
                  <span>Edit</span>
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
    [eventMappingId, handleDelete, navigate]
  )

  if (isLoading) {
    return <AppPreloader />
  }

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No field mappings yet"
      description="Derive a Contact attribute or custom field value directly from this event's data">
      <Button
        variant="black"
        onClick={() => navigate(`/event-mappings/${eventMappingId}/fields/new`)}>
        New Field Mapping
      </Button>
    </EmptyContent>
  )

  return (
    <div className="animate-slide-up h-full">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold lg:text-2xl">Fields</h1>
        {hasData && (
          <NewButton
            label="New Field Mapping"
            onClick={() => navigate(`/event-mappings/${eventMappingId}/fields/new`)}
          />
        )}
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="p-6">{emptyContent}</CardContent>
        </Card>
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

      <DeleteConfirmation ref={deleteModalRef} />
    </div>
  )
}
