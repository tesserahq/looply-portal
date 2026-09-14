import { DataTable } from '@/components/data-table'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import ContactInteractionShortcut from '@/components/dialog/contact-interaction-shorcut'
import EmptyContent from '@/components/empty-content/empty-content'
import { ApiErrorOverlay } from '@/components/misc/api-error-overlay'
import { AppPreloader } from '@/components/loader/pre-loader'
import NewButton from '@/components/new-button/new-button'
import { ResourceID, useApp } from 'tessera-ui'
import useDebounce from '@/hooks/useDebounce'
import {
  useContacts,
  useContactStatuses,
  useContactTypes,
  useDeleteContact,
} from '@/resources/hooks/contacts'
import { ContactType } from '@/resources/queries/contacts/contact.type'
import { ContactStatusBadge } from '@/components/contact-status/contact-status'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import type { LoaderFunctionArgs } from 'react-router'
import { Link, useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@shadcn/ui/input-group'
import { Label } from '@shadcn/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shadcn/ui/select'
import type { ColumnDef } from '@tanstack/react-table'
import { Contact, Edit, Ellipsis, EyeIcon, Import, Search, Tag, Trash2, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { TagsInput } from 'tessera-ui/components'

const ALL_STATUSES = '__all_statuses__'
const ALL_CONTACT_TYPES = '__all_contact_types__'

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
  const [contactSearch, setContactSearch] = useState<string>(searchParams.get('q') || '')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [tagFilter, setTagFilter] = useState<string[]>(
    (searchParams.get('tags') || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  )
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '')
  const [contactTypeFilter, setContactTypeFilter] = useState<string>(
    searchParams.get('contact_type') || ''
  )
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const contactInteractionRef = useRef<React.ComponentRef<typeof ContactInteractionShortcut>>(null)

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const { data: contactStatusesData } = useContactStatuses(config)
  const { data: contactTypesData } = useContactTypes(config)

  const { data, isLoading, apiError } = useContacts(
    config,
    {
      page,
      size,
      ...(tagFilter.length > 0
        ? { tags: tagFilter.join(',') }
        : debouncedSearch.length >= 3 && { q: debouncedSearch }),
      ...(statusFilter && { status: statusFilter }),
      ...(contactTypeFilter && { contact_type: contactTypeFilter }),
    },
    {
      enabled: !!token,
    }
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
    [deleteContact]
  )

  const handleSearchChange = (search: string) => {
    setContactSearch(search)
  }

  const handleTagFilterChange = (tags: string[]) => {
    setTagFilter(tags)
    // Tag filtering and text search stay mutually exclusive in this UI (the
    // backend can combine them, but a tag filter plus free text is a
    // confusing combination for a user to reason about), so picking a tag
    // clears any in-progress text search.
    if (tags.length > 0) {
      setContactSearch('')
      setDebouncedSearch('')
      searchParams.delete('q')
    }
    if (tags.length > 0) {
      searchParams.set('tags', tags.join(','))
    } else {
      searchParams.delete('tags')
    }
    setSearchParams(searchParams)
  }

  const handleStatusFilterChange = (value: string) => {
    const status = value === ALL_STATUSES ? '' : value
    setStatusFilter(status)
    if (status) {
      searchParams.set('status', status)
    } else {
      searchParams.delete('status')
    }
    setSearchParams(searchParams)
  }

  const handleContactTypeFilterChange = (value: string) => {
    const contactType = value === ALL_CONTACT_TYPES ? '' : value
    setContactTypeFilter(contactType)
    if (contactType) {
      searchParams.set('contact_type', contactType)
    } else {
      searchParams.delete('contact_type')
    }
    setSearchParams(searchParams)
  }

  // Debounce search query - only trigger API call when search is >= 3 characters
  useDebounce(
    () => {
      if (contactSearch.length >= 3) {
        setDebouncedSearch(contactSearch)
        if (tagFilter.length > 0) {
          setTagFilter([])
          searchParams.delete('tags')
        }
        // setSearchParams({ q: contactSearch })
        searchParams.set('q', contactSearch)
        setSearchParams(searchParams)
      } else {
        // Clear search query if less than 3 characters
        setDebouncedSearch('')
        searchParams.delete('q')
        setSearchParams(searchParams)
        // setSearchParams({ q: '' })
      }
    },
    [contactSearch],
    300
  )

  const hasSearchQuery = useMemo(() => {
    return searchParams.get('q') !== null && searchParams.get('q') !== ''
  }, [searchParams])

  const hasTagFilter = tagFilter.length > 0
  const hasStatusFilter = !!statusFilter
  const hasContactTypeFilter = !!contactTypeFilter
  const hasAnyFilter = hasSearchQuery || hasTagFilter || hasStatusFilter || hasContactTypeFilter

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
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        cell: ({ row }) => {
          return <ContactStatusBadge status={row.original.status} />
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
          return <span className="text-left text-sm capitalize">{contact_type || '-'}</span>
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
              {phone_type && <span className="text-muted-foreground text-xs">({phone_type})</span>}
            </div>
          )
        },
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) => {
          const { tags } = row.original
          if (!tags || tags.length === 0) return <span className="text-muted-foreground">-</span>
          return (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
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
                  className="flex w-full justify-start gap-2"
                  onClick={() => contactInteractionRef.current?.onOpen(row.original)}>
                  <Contact size={18} />
                  <span>Interaction</span>
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

  if (isLoading && contactSearch === '') {
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
    <div className="page-content h-full">
      <div className="mb-5 animate-slide-up flex flex-col gap-y-4">
        <h1 className="page-title">Contacts</h1>
        {(hasAnyFilter || hasData) && (
          <div
            className="flex flex-col flex-col-reverse -mt-11 md:mt-0 md:flex-row items-end
              md:items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <InputGroup className="dark:bg-card max-w-96 bg-white">
                <InputGroupInput
                  placeholder="Search contacts"
                  value={contactSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                {contactSearch && (
                  <InputGroupAddon align="inline-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-transparent"
                      onClick={() => handleSearchChange('')}>
                      <X />
                    </Button>
                  </InputGroupAddon>
                )}
              </InputGroup>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={hasTagFilter ? 'default' : 'outline'} size="icon">
                    <Tag size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-3">
                  <Label className="mb-1.5 block">Filter by tag</Label>
                  <TagsInput
                    value={tagFilter}
                    onChange={handleTagFilterChange}
                    placeholder="Add a tag to filter by"
                  />
                </PopoverContent>
              </Popover>
              <Select value={statusFilter || ALL_STATUSES} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                  {(contactStatusesData?.items || []).map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={contactTypeFilter || ALL_CONTACT_TYPES}
                onValueChange={handleContactTypeFilterChange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CONTACT_TYPES}>All types</SelectItem>
                  {(contactTypesData?.items || []).map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <NewButton
                label="Import Contacts"
                onClick={() => navigate('imports')}
                variant="outline"
                name="Import"
                icon={<Import />}
              />
              <NewButton label="New Contact" onClick={() => navigate('/contacts/new')} />
            </div>
          </div>
        )}
      </div>
      <div className="animate-slide-up">
        {apiError ? (
          <ApiErrorOverlay
            statusCode={apiError?.statusCode ?? 403}
            message={apiError?.message ?? 'Access denied.'}
            rawMessage={apiError?.rawMessage}
          />
        ) : !hasData && !hasAnyFilter ? (
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
      </div>

      <DeleteConfirmation ref={deleteModalRef} />
      <ContactInteractionShortcut ref={contactInteractionRef} apiUrl={apiUrl!} nodeEnv={nodeEnv!} />
    </div>
  )
}
