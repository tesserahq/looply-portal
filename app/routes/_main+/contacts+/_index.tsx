/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppPreloader } from '@/components/misc/AppPreloader'
import { DataTable } from '@/components/misc/Datatable'
import DeleteConfirmation from '@/components/misc/Dialog/DeleteConfirmation'
import EmptyContent from '@/components/misc/EmptyContent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { IContact } from '@/types/contact'
import { IPaging } from '@/types/pagination'
import { handleFetcherData } from '@/utils/fetcher.data'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import { redirectWithToast } from '@/utils/toast.server'
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData, useNavigate } from '@remix-run/react'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, EllipsisVertical, EyeIcon, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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

export default function Contacts() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const handleApiError = useHandleApiError()
  const { token } = useApp()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [data, setData] = useState<IPaging<IContact>>()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<IContact | null>(null)
  const deleteFetcher = useFetcher()

  const fetchData = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response: IPaging<IContact> = await fetchApi(
        `${apiUrl}/contacts`,
        token,
        nodeEnv,
        {
          params: { page, size },
        },
      )
      setData(response)
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token, page, size])

  useEffect(() => {
    if (deleteFetcher.data) {
      handleFetcherData(deleteFetcher.data, (responseData) => {
        setData((prevData) => {
          if (!prevData) return prevData
          return {
            ...prevData,
            total: prevData.total - 1,
            pages: Math.ceil((prevData.total - 1) / prevData.size),
            items: prevData.items.filter((item) => item.id !== responseData.id),
          }
        })
        setIsDeleteDialogOpen(false)
        setSelectedContact(null)
      })
    }
  }, [deleteFetcher.data])

  const handleDeleteClick = (contact: IContact) => {
    setSelectedContact(contact)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedContact && token) {
      const formData = new FormData()
      formData.append('intent', 'delete')
      formData.append('id', selectedContact.id)
      formData.append('token', token)

      deleteFetcher.submit(formData, {
        method: 'POST',
      })
    }
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    if (deleteFetcher.state === 'idle') {
      setSelectedContact(null)
    }
  }

  const columns: ColumnDef<IContact>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: '',
        size: 5,
        cell: ({ row }) => {
          const { id } = row.original

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost">
                  <EllipsisVertical size={18} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="right" className="w-44 p-2">
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/contacts/${id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => {
                    navigate(`/contacts/${id}/edit`)
                  }}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDeleteClick(row.original)}>
                  <Trash2 size={18} />
                  <span>Delete</span>
                </Button>
              </PopoverContent>
            </Popover>
          )
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 250,
        cell: ({ row }) => {
          const email = row.original.email
          if (!email) return <span className="text-muted-foreground">-</span>
          return (
            <div className="flex items-center gap-2">
              <Link to={`/contacts/${row.original.id}`} className="button-link">
                <span className="text-sm">{email}</span>
              </Link>
              <Badge variant="outline">
                {row.original.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: 'first_name',
        header: 'Name',
        size: 200,
        cell: ({ row }) => {
          const { first_name, last_name } = row.original
          const fullName = [first_name, last_name].filter(Boolean).join(' ')
          return <span className="text-left">{fullName || '-'}</span>
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        size: 200,
        cell: ({ row }) => {
          const { phone, phone_type } = row.original
          if (!phone) return <span className="text-muted-foreground">-</span>
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm">{phone}</span>
              {phone_type && (
                <span className="text-xs text-muted-foreground">({phone_type})</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'address',
        header: 'Address',
        size: 300,
        cell: ({ row }) => {
          const { city, state, country } = row.original
          const address = [city, state, country].filter(Boolean).join(', ')
          if (!address) return <span className="text-muted-foreground">-</span>
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm">{address}</span>
            </div>
          )
        },
      },
    ],
    [navigate, handleDeleteClick],
  )

  if (isLoading) {
    return <AppPreloader className="min-h-screen" />
  }

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No contacts found"
      description="Get started by creating your first contact">
      <Button variant="black" onClick={() => navigate('/contacts/new')}>
        New Contact
      </Button>
    </EmptyContent>
  )

  return (
    <div className="h-full animate-slide-up">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-foreground">Contacts</h1>
        {data && data.items.length > 0 && (
          <Button onClick={() => navigate('/contacts/new')}>New Contact</Button>
        )}
      </div>

      {data && data.items.length > 0 ? (
        <DataTable
          columns={columns}
          data={data.items}
          meta={{
            page: data.page,
            pages: data.pages,
            size: data.size,
            total: data.total,
          }}
        />
      ) : (
        <div className="mt-10">{emptyContent}</div>
      )}

      <DeleteConfirmation
        open={isDeleteDialogOpen}
        onOpenChange={handleCloseDeleteDialog}
        title="Remove Contact"
        description={`This will remove "${selectedContact?.email}" from your contacts. This action cannot be undone.`}
        onDelete={handleDeleteConfirm}
        fetcher={deleteFetcher}
      />
    </div>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const intent = formData.get('intent')
  const contactId = formData.get('id')

  if (intent === 'delete' && contactId) {
    const token = formData.get('token') as string

    try {
      await fetchApi(`${apiUrl}/contacts/${contactId}`, token, nodeEnv, {
        method: 'DELETE',
      })

      return Response.json(
        {
          toast: {
            type: 'success',
            title: 'Success',
            description: 'Successfully removed vehicle',
          },
          response: { id: contactId },
        },
        { status: 200 },
      )
    } catch (error: any) {
      const convertError = JSON.parse(error?.message)
      return redirectWithToast('/contacts', {
        type: 'error',
        title: 'Error',
        description: `${convertError.status} - ${convertError.error}`,
      })
    }
  }

  return null
}
