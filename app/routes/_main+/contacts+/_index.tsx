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
import useDebounce from '@/hooks/useDebounce'
import { fetchApi } from '@/libraries/fetch'
import { IContact } from '@/types/contact'
import { IPaging } from '@/types/pagination'
import { handleFetcherData } from '@/utils/fetcher.data'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import { redirectWithToast } from '@/utils/toast.server'
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import {
  Link,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from '@remix-run/react'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Ellipsis, EyeIcon, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useScopedParams } from '@/utils/scoped_params'
import CreateButton from '@/components/misc/CreateButton'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

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
  const { getScopedSearch } = useScopedParams()
  const { token } = useApp()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false)
  const [data, setData] = useState<IPaging<IContact>>()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<IContact | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState<string>(searchParams.get('q') || '')
  const deleteFetcher = useFetcher()

  const fetchData = async (searchQuery?: string) => {
    if (!token) return

    // Determine endpoint and params based on search query
    const hasSearchQuery = searchQuery && searchQuery.trim() !== ''
    const endpoint = hasSearchQuery ? `${apiUrl}/contacts/search` : `${apiUrl}/contacts`
    const params = hasSearchQuery ? { page, size, q: searchQuery } : { page, size }

    try {
      const response: IPaging<IContact> = await fetchApi(endpoint, token, nodeEnv, {
        params,
      })
      setData(response)
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
      setIsLoadingSearch(false)
      if (!hasSearchQuery) {
        searchParams.delete('q')
        setSearchParams(searchParams)
      }
    }
  }

  const fetchSearch = async (search: string) => {
    if (!token) return

    if (search) {
      navigate(getScopedSearch({ q: search }))
    } else {
      // setIsLoading(true)
    }
    await fetchData(search)
  }

  const handleSearch = (search: string) => setSearch(search)

  // Debounced search - only triggers when user types (not on initial load)
  useDebounce(
    () => {
      // prevent on first load
      if (!isLoading) {
        setIsLoadingSearch(true)
        fetchSearch(search)
      }
    },
    [search],
    500,
  )

  // Initial data load and pagination changes
  useEffect(() => {
    if (token) {
      const searchQuery = searchParams.get('q')
      // Use search query from URL if available, otherwise fetch all contacts
      fetchData(searchQuery || undefined)
    }
  }, [token])

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

  const hasSearchQuery = useMemo(() => {
    return searchParams.get('q') !== null && searchParams.get('q') !== ''
  }, [searchParams])

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const columns: ColumnDef<IContact>[] = useMemo(
    () => [
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
        cell: ({ row }) => {
          const email = row.original.email
          if (!email) return <span className="text-muted-foreground">-</span>
          return (
            <div className="inline">
              <Link to={`/contacts/${row.original.id}`} className="button-link">
                <span className="text-sm">{email}</span>
              </Link>
            </div>
          )
        },
      },
      {
        accessorKey: 'state',
        header: 'State',
        size: 100,
        cell: ({ row }) => {
          return (
            <Badge variant="outline">
              {row.original.is_active ? 'Active' : 'Inactive'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'first_name',
        header: 'Name',
        cell: ({ row }) => {
          const { first_name, last_name } = row.original
          const fullName = [first_name, last_name].filter(Boolean).join(' ')
          return <span className="text-left">{fullName || '-'}</span>
        },
      },
      {
        accessorKey: 'contact_type',
        header: 'Contact Type',
        cell: ({ row }) => {
          const { contact_type } = row.original
          return (
            <span className="text-left text-sm capitalize">{contact_type || '-'}</span>
          )
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
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
              <span className="truncate text-sm">{address}</span>
            </div>
          )
        },
      },
    ],
    [navigate, handleDeleteClick],
  )

  if (isLoading) {
    return <AppPreloader />
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

  const emptySearchContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No contacts found"
      description="Try adjusting your search criteria"
    />
  )

  return (
    <div className="h-full animate-slide-up">
      <div className="mb-5 flex flex-col gap-y-4">
        <h1 className="page-title">Contacts</h1>
        {(hasSearchQuery || hasData) && (
          <div className="flex items-center justify-between">
            <InputGroup className="max-w-96 bg-white dark:bg-card">
              <InputGroupInput
                placeholder="Search contacts"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              {search && (
                <InputGroupAddon align="inline-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-transparent"
                    onClick={() => setSearch('')}>
                    <X />
                  </Button>
                </InputGroupAddon>
              )}
            </InputGroup>
            <CreateButton label="New Contact" onClick={() => navigate('/contacts/new')} />
          </div>
        )}
      </div>
      {!hasData && !hasSearchQuery ? (
        emptyContent
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          hasFilter
          isLoading={isLoadingSearch}
          empty={emptySearchContent}
          meta={
            data
              ? {
                  page: data.page,
                  pages: data.pages,
                  size: data.size,
                  total: data.total,
                }
              : undefined
          }
        />
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
            description: 'Successfully removed contact',
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
