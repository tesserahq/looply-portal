import { DataTable } from '@/components/data-table'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import EmptyContent from '@/components/empty-content/empty-content'
import { ApiErrorOverlay } from '@/components/misc/api-error-overlay'
import { AppPreloader } from '@/components/loader/pre-loader'
import NewButton from '@/components/new-button/new-button'
import { fetchTagUsage, useDeleteTag, useTags } from '@/resources/hooks/tags'
import { TagWithCountsType } from '@/resources/queries/tags'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Ellipsis, Trash2 } from 'lucide-react'
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

export default function Tags() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const { data, isLoading, apiError } = useTags(config, { page, size })

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const { mutate: deleteTag } = useDeleteTag(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
    },
  })

  const handleDelete = useCallback(
    (tag: TagWithCountsType) => {
      const baseDescription = `This will remove "${tag.name}" permanently. This action cannot be undone.`

      deleteModalRef.current?.open({
        title: 'Delete Tag',
        description: 'Checking where this tag is used...',
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteTag(tag.id)
        },
      })

      fetchTagUsage(config, tag.id)
        .then((usage) => {
          const impactParts: string[] = []
          if (usage.contacts_count > 0) impactParts.push(`${usage.contacts_count} contact(s)`)
          if (usage.campaigns_count > 0) impactParts.push(`${usage.campaigns_count} campaign(s)`)
          const impactText =
            impactParts.length > 0 ? ` It will be removed from ${impactParts.join(' and ')}.` : ''
          const segmentsText =
            usage.segments.length > 0
              ? ` It's also used by these segments, which will stop matching it: ${usage.segments
                  .map((s) => s.name)
                  .join(', ')}.`
              : ''

          deleteModalRef.current?.updateConfig({
            description: `${baseDescription}${impactText}${segmentsText}`,
          })
        })
        .catch(() => {
          deleteModalRef.current?.updateConfig({ description: baseDescription })
        })
    },
    [deleteTag, apiUrl, token, nodeEnv]
  )

  const columns: ColumnDef<TagWithCountsType>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 250,
        cell: ({ row }) => (
          <Link to={`/tags/${row.original.id}/edit`} className="button-link">
            <span className="text-sm font-medium">{row.original.name}</span>
          </Link>
        ),
      },
      {
        accessorKey: 'contacts_count',
        header: 'Contacts',
        size: 100,
        cell: ({ row }) => <Badge variant="outline">{row.original.contacts_count}</Badge>,
      },
      {
        accessorKey: 'campaigns_count',
        header: 'Campaigns',
        size: 100,
        cell: ({ row }) => <Badge variant="outline">{row.original.campaigns_count}</Badge>,
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
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/tags/${row.original.id}/edit`)}>
                  <Edit size={18} />
                  <span>Rename</span>
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
      title="No tags found"
      description="Get started by creating your first tag">
      <Button variant="black" onClick={() => navigate('/tags/new')}>
        New Tag
      </Button>
    </EmptyContent>
  )

  return (
    <div className="page-content h-full">
      <div className="mb-5 animate-slide-up flex items-center justify-between">
        <h1 className="page-title">Tags</h1>
        {hasData && <NewButton label="New Tag" onClick={() => navigate('/tags/new')} />}
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
