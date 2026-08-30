import { DataTable } from '@/components/data-table'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import EmptyContent from '@/components/empty-content/empty-content'
import { ApiErrorOverlay } from '@/components/misc/api-error-overlay'
import { AppPreloader } from '@/components/loader/pre-loader'
import NewButton from '@/components/new-button/new-button'
import { useSegments, useDeleteSegment } from '@/resources/hooks/segments'
import { SegmentType, summarizeSegmentRuleShape } from '@/resources/queries/segments'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Ellipsis, EyeIcon, Trash2 } from 'lucide-react'
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

export default function Segments() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const { data, isLoading, apiError } = useSegments(config, {
    page,
    size,
  })

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const { mutate: deleteSegment } = useDeleteSegment(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/segments')
    },
  })

  const handleDelete = useCallback(
    (segment: SegmentType) => {
      deleteModalRef.current?.open({
        title: 'Remove Segment',
        description: `This will remove "${segment.name}" from your segments. Campaigns already referencing it are not affected. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteSegment(segment.id)
        },
      })
    },
    [deleteSegment]
  )

  const columns: ColumnDef<SegmentType>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 300,
        cell: ({ row }) => {
          const name = row.original.name
          if (!name) return <span className="text-muted-foreground">-</span>
          return (
            <div className="inline">
              <Link to={`/segments/${row.original.id}`} className="button-link">
                <span className="text-sm font-medium">{name}</span>
              </Link>
            </div>
          )
        },
      },
      {
        accessorKey: 'rule',
        header: 'Rule',
        size: 250,
        cell: ({ row }) => {
          return (
            <span className="text-muted-foreground text-sm">
              {summarizeSegmentRuleShape(row.original.rule.root)}
            </span>
          )
        },
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
        accessorKey: 'updated_at',
        header: 'Updated At',
        size: 100,
        cell: ({ row }) => {
          const { updated_at } = row.original
          if (!updated_at) return <span className="text-muted-foreground">-</span>
          return <DateTime date={updated_at} formatStr="dd/MM/yyyy" />
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
          const { id } = row.original

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
                  onClick={() => navigate(`/segments/${id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => {
                    navigate(`/segments/${id}/edit`)
                  }}>
                  <Edit size={18} />
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
    [navigate, handleDelete]
  )

  if (isLoading) {
    return <AppPreloader />
  }

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No segments found"
      description="Get started by creating your first segment">
      <Button variant="black" onClick={() => navigate('/segments/new')}>
        New Segment
      </Button>
    </EmptyContent>
  )

  return (
    <div className="page-content h-full">
      <div className="mb-5 animate-slide-up flex items-center justify-between">
        <h1 className="page-title">Segments</h1>
        {hasData && <NewButton label="New Segment" onClick={() => navigate('/segments/new')} />}
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
