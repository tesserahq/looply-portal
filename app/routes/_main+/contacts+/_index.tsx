import { AppPreloader } from '@/components/loader/pre-loader'
import { DataTable } from '@/components/data-table'
import EmptyContent from '@/components/empty-content/empty-content'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { useApp } from '@/context/AppContext'
import { useContacts, useDeleteContact } from '@/resources/hooks/contacts'
import { ContactType } from '@/resources/queries/contacts/contact.type'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Ellipsis, EyeIcon, Search, Trash2, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import NewButton from '@/components/new-button/new-button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@shadcn/ui/input-group'
import useDebounce from '@/hooks/useDebounce'

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
  const { token } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState<string>(searchParams.get('q') || '')
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const searchQuery = search && search.trim() !== '' ? search : undefined

  const { data, isLoading } = useContacts(
    config,
    {
      page,
      size,
      q: searchQuery,
    },
    {
      enabled: !!token,
    },
  )

  const { mutate: deleteContact } = useDeleteContact(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
    },
  })

  const handleDelete = useCallback(
    (contact: ContactType) => {
      deleteModalRef.current?.open({
        title: 'Remove Contact',
        description: `This will remove "${contact.email}" from your contacts. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteContact(contact.id)
        },
      })
    },
    [deleteContact],
  )

  const handleSearch = (searchValue: string) => {
    setSearch(searchValue)
    if (searchValue.trim() === '') {
      searchParams.delete('q')
      setSearchParams(searchParams)
    } else {
      searchParams.set('q', searchValue)
      setSearchParams(searchParams)
    }
  }

  // Debounced search - only triggers when user types (not on initial load)
  useDebounce(
    () => {
      // Search is handled by the query hook
    },
    [search],
    500,
  )

  const hasSearchQuery = useMemo(() => {
    return searchParams.get('q') !== null && searchParams.get('q') !== ''
  }, [searchParams])

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const columns: ColumnDef<ContactType>[] = useMemo(
    () => [
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
            <Badge variant="active">
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
            <NewButton label="New Contact" onClick={() => navigate('/contacts/new')} />
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
          isLoading={isLoading}
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

      <DeleteConfirmation ref={deleteModalRef} />
    </div>
  )
}
