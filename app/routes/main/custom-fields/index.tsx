import { DataTable } from '@/components/data-table'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import EmptyContent from '@/components/empty-content/empty-content'
import { ApiErrorOverlay } from '@/components/misc/api-error-overlay'
import { AppPreloader } from '@/components/loader/pre-loader'
import NewButton from '@/components/new-button/new-button'
import {
  useCustomFieldDefinitions,
  useDeleteCustomFieldDefinition,
} from '@/resources/hooks/custom-fields'
import { CustomFieldDefinitionType } from '@/resources/queries/custom-fields'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import type { ColumnDef } from '@tanstack/react-table'
import { Ellipsis, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData, useNavigate } from 'react-router'
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

export default function CustomFields() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const { data, isLoading, apiError } = useCustomFieldDefinitions(config, {
    page,
    size,
  })

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const { mutate: deleteDefinition } = useDeleteCustomFieldDefinition(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
    },
  })

  const handleDelete = useCallback(
    (definition: CustomFieldDefinitionType) => {
      deleteModalRef.current?.open({
        title: 'Remove Custom Field',
        description: `This will remove "${definition.name}" and its values from all contacts. Segments referencing it will fail to resolve. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteDefinition(definition.id)
        },
      })
    },
    [deleteDefinition]
  )

  const columns: ColumnDef<CustomFieldDefinitionType>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 250,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'label',
        header: 'Label',
        size: 250,
        cell: ({ row }) => {
          const label = row.original.label
          if (!label) return <span className="text-muted-foreground">-</span>
          return <span className="text-muted-foreground text-sm">{label}</span>
        },
      },
      {
        accessorKey: 'value_type',
        header: 'Value Type',
        size: 120,
        cell: ({ row }) => <Badge variant="outline">{row.original.value_type}</Badge>,
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
        cell: ({ row }) => {
          return <ResourceID value={row.original.id} />
        },
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
    [handleDelete]
  )

  if (isLoading) {
    return <AppPreloader />
  }

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No custom fields found"
      description="Get started by defining your first custom field">
      <Button variant="black" onClick={() => navigate('/custom-fields/new')}>
        New Custom Field
      </Button>
    </EmptyContent>
  )

  return (
    <div className="page-content h-full">
      <div className="mb-5 animate-slide-up flex items-center justify-between">
        <h1 className="page-title">Custom Fields</h1>
        {hasData && (
          <NewButton label="New Custom Field" onClick={() => navigate('/custom-fields/new')} />
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
