/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppPreloader } from '@/components/misc/AppPreloader'
import { DataTable } from '@/components/misc/Datatable'
import DeleteConfirmation from '@/components/misc/Dialog/DeleteConfirmation'
import EmptyContent from '@/components/misc/EmptyContent'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import useDebounce from '@/hooks/useDebounce'
import { fetchApi } from '@/libraries/fetch'
import { IWaitingList } from '@/types/waiting-list'
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
import { format } from 'date-fns'

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
  const handleApiError = useHandleApiError()
  const { getScopedSearch } = useScopedParams()
  const { token } = useApp()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false)
  const [data, setData] = useState<IPaging<IWaitingList>>()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedWaitingList, setSelectedWaitingList] = useState<IWaitingList | null>(
    null,
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState<string>(searchParams.get('q') || '')
  const deleteFetcher = useFetcher()

  const fetchData = async (searchQuery?: string) => {
    if (!token) return

    // Determine endpoint and params based on search query
    const hasSearchQuery = searchQuery && searchQuery.trim() !== ''
    const endpoint = hasSearchQuery
      ? `${apiUrl}/waiting-lists/search`
      : `${apiUrl}/waiting-lists`
    const params = hasSearchQuery ? { page, size, q: searchQuery } : { page, size }

    try {
      const response: IPaging<IWaitingList> = await fetchApi(endpoint, token, nodeEnv, {
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
      // Use search query from URL if available, otherwise fetch all waiting lists
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
        setSelectedWaitingList(null)
      })
    }
  }, [deleteFetcher.data])

  const handleDeleteClick = (waitingList: IWaitingList) => {
    setSelectedWaitingList(waitingList)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedWaitingList && token) {
      const formData = new FormData()
      formData.append('intent', 'delete')
      formData.append('id', selectedWaitingList.id)
      formData.append('token', token)

      deleteFetcher.submit(formData, {
        method: 'POST',
      })
    }
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    if (deleteFetcher.state === 'idle') {
      setSelectedWaitingList(null)
    }
  }

  const hasSearchQuery = useMemo(() => {
    return searchParams.get('q') !== null && searchParams.get('q') !== ''
  }, [searchParams])

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const columns: ColumnDef<IWaitingList>[] = useMemo(
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
          return (
            <span className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </span>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: 180,
        cell: ({ row }) => {
          const { created_at } = row.original
          if (!created_at) return <span className="text-muted-foreground">-</span>
          return (
            <span className="text-sm">{format(new Date(created_at + 'z'), 'PPP')}</span>
          )
        },
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        size: 180,
        cell: ({ row }) => {
          const { updated_at } = row.original
          if (!updated_at) return <span className="text-muted-foreground">-</span>
          return (
            <span className="text-sm">{format(new Date(updated_at + 'z'), 'PPP')}</span>
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
      title="No waiting lists found"
      description="Get started by creating your first waiting list">
      <Button variant="black" onClick={() => navigate('/waiting-lists/new')}>
        New Waiting List
      </Button>
    </EmptyContent>
  )

  const emptySearchContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No waiting lists found"
      description="Try adjusting your search criteria"
    />
  )

  return (
    <div className="h-full animate-slide-up">
      <div className="mb-5 flex items-center justify-between gap-y-4">
        <h1 className="page-title">Waiting Lists</h1>
        {(hasSearchQuery || hasData) && (
          <div className="flex items-center justify-end">
            <InputGroup className="hidden max-w-96 bg-white dark:bg-card">
              <InputGroupInput
                placeholder="Search waiting lists"
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
            <CreateButton
              label="New Waiting List"
              onClick={() => navigate('/waiting-lists/new')}
            />
          </div>
        )}
      </div>
      {!hasData && !hasSearchQuery ? (
        emptyContent
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
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
        title="Remove Waiting List"
        description={`This will remove "${selectedWaitingList?.name}" from your waiting lists. This action cannot be undone.`}
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
  const waitingListId = formData.get('id')

  if (intent === 'delete' && waitingListId) {
    const token = formData.get('token') as string

    try {
      await fetchApi(`${apiUrl}/waiting-lists/${waitingListId}`, token, nodeEnv, {
        method: 'DELETE',
      })

      return Response.json(
        {
          toast: {
            type: 'success',
            title: 'Success',
            description: 'Successfully removed waiting list',
          },
          response: { id: waitingListId },
        },
        { status: 200 },
      )
    } catch (error: any) {
      const convertError = JSON.parse(error?.message)
      return redirectWithToast('/waiting-lists', {
        type: 'error',
        title: 'Error',
        description: `${convertError.status} - ${convertError.error}`,
      })
    }
  }

  return null
}
