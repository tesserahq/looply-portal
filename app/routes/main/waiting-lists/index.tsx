import { DataTable } from '@/components/data-table'
import { DateTime } from '@/components/datetime'
import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import { useApp } from 'tessera-ui'
import { useWaitingLists, useDeleteWaitingList } from '@/resources/hooks/waiting-lists'
import { WaitingListType } from '@/resources/queries/waiting-lists'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import type { LoaderFunctionArgs } from 'react-router'
import { Link, useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Ellipsis, EyeIcon, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'
import NewButton from '@/components/new-button/new-button'

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

export default function WaitingLists() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const searchQuery = searchParams.get('q') || undefined

  const { data, isLoading } = useWaitingLists(config, {
    page,
    size,
    q: searchQuery,
  })

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const { mutate: deleteWaitingList } = useDeleteWaitingList(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/waiting-lists')
    },
  })

  const handleDelete = useCallback(
    (waitingList: WaitingListType) => {
      deleteModalRef.current?.open({
        title: 'Remove Waiting List',
        description: `This will remove "${waitingList.name}" from your waiting lists. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteWaitingList(waitingList.id)
        },
      })
    },
    [deleteWaitingList]
  )

  const columns: ColumnDef<WaitingListType>[] = useMemo(
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
              <Link to={`/waiting-lists/${row.original.id}`} className="button-link">
                <span className="text-sm font-medium">{name}</span>
              </Link>
            </div>
          )
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 400,
        cell: ({ row }) => {
          const { description } = row.original
          if (!description) return <span className="text-muted-foreground">-</span>
          return <span className="text-muted-foreground line-clamp-2 text-sm">{description}</span>
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: 180,
        cell: ({ row }) => {
          const { created_at } = row.original
          if (!created_at) return <span className="text-muted-foreground">-</span>
          return <DateTime date={created_at} />
        },
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        size: 180,
        cell: ({ row }) => {
          const { updated_at } = row.original
          if (!updated_at) return <span className="text-muted-foreground">-</span>
          return <DateTime date={updated_at} />
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
              <PopoverContent align="start" side="right" className="w-44 p-2">
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/waiting-lists/${id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => {
                    navigate(`/waiting-lists/${id}/edit`)
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
      title="No waiting lists found"
      description="Get started by creating your first waiting list">
      <Button variant="black" onClick={() => navigate('/waiting-lists/new')}>
        New Waiting List
      </Button>
    </EmptyContent>
  )

  return (
    <div className="page-content h-full">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="page-title">Waiting Lists</h1>
        {hasData && (
          <NewButton label="New Waiting List" onClick={() => navigate('/waiting-lists/new')} />
        )}
      </div>
      {!hasData ? (
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

      <DeleteConfirmation ref={deleteModalRef} />
    </div>
  )
}
