import { DataTable } from '@/components/data-table'
import { DateTime } from '@/components/datetime'
import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import { useApp } from '@/context/AppContext'
import { useContactLists, useDeleteContactList } from '@/resources/hooks/contact-lists'
import { ContactListType } from '@/resources/queries/contact-lists'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { Badge } from '@shadcn/ui/badge'
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

export default function ContactLists() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const { data, isLoading } = useContactLists(config, {
    page,
    size,
  })

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const { mutate: deleteContactList } = useDeleteContactList(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/contact-lists')
    },
  })

  const handleDelete = useCallback(
    (contactList: ContactListType) => {
      deleteModalRef.current?.open({
        title: 'Remove Contact List',
        description: `This will remove "${contactList.name}" from your contact lists. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteContactList(contactList.id)
        },
      })
    },
    [deleteContactList],
  )

  const columns: ColumnDef<ContactListType>[] = useMemo(
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
              <Link to={`/contact-lists/${row.original.id}`} className="button-link">
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
          return (
            <span className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </span>
          )
        },
      },
      {
        accessorKey: 'is_public',
        header: 'Visibility',
        size: 100,
        cell: ({ row }) => {
          return (
            <Badge variant={row.original.is_public ? 'public' : 'private'}>
              {row.original.is_public ? 'Public' : 'Private'}
            </Badge>
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
          return <DateTime date={created_at} />
        },
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        size: 100,
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
                  onClick={() => navigate(`/contact-lists/${id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => {
                    navigate(`/contact-lists/${id}/edit`)
                  }}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground"
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
    [navigate, handleDelete],
  )

  if (isLoading) {
    return <AppPreloader />
  }

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No contact lists found"
      description="Get started by creating your first contact list">
      <Button variant="black" onClick={() => navigate('/contact-lists/new')}>
        New Contact List
      </Button>
    </EmptyContent>
  )

  return (
    <div className="h-full animate-slide-up">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="page-title">Contact Lists</h1>
        <NewButton
          label="New Contact List"
          onClick={() => navigate('/contact-lists/new')}
        />
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
