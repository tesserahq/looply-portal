/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppPreloader } from '@/components/misc/AppPreloader'
import CreateButton from '@/components/misc/CreateButton'
import { DataTable } from '@/components/misc/Datatable'
import DeleteConfirmation from '@/components/misc/Dialog/DeleteConfirmation'
import NewMemberContactList from '@/components/misc/Dialog/NewMemberContactList'
import NewMemberWaitingList from '@/components/misc/Dialog/NewMemberWaitingList'
import UpdateMemberWaitingListStatus from '@/components/misc/Dialog/UpdateMemberWaitingListStatus'
import EmptyContent from '@/components/misc/EmptyContent'
import { StatusBadge } from '@/components/misc/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { IContact } from '@/types/contact'
import {
  IWaitingList,
  IWaitingListMember,
  IWaitingListStatus,
} from '@/types/waiting-list'
import { handleFetcherData } from '@/utils/fetcher.data'
import { cn } from '@/utils/misc'
import { redirectWithToast } from '@/utils/toast.server'
import { ActionFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { ColumnDef, useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Edit, EllipsisVertical, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function WaitingListDetail() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const handleApiError = useHandleApiError()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const newMemberFetcher = useFetcher()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [waitingList, setWaitingList] = useState<IWaitingList | null>(null)
  const [members, setMembers] = useState<IWaitingListMember[] | IContact[]>([])
  const [memberStatuses, setMemberStatuses] = useState<IWaitingListStatus[]>([])
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [isLoadingByStatus, setIsLoadingByStatus] = useState<boolean>(false)
  const [selectedMember, setSelectedMember] = useState<
    IWaitingListMember | IContact | null
  >(null)
  const [memberStatus, setMemberStatus] = useState<string>('all')
  const deleteFetcher = useFetcher()
  const updateMemberFetcher = useFetcher()
  const newMemberRef = useRef<React.ElementRef<typeof NewMemberContactList>>(null)
  const updateMemberRef =
    useRef<React.ElementRef<typeof UpdateMemberWaitingListStatus>>(null)
  const [rowSelection, setRowSelection] = useState({})

  // Type guard helper
  const isWaitingListMember = useCallback(
    (member: IWaitingListMember | IContact): member is IWaitingListMember => {
      return 'contact' in member && 'status' in member
    },
    [],
  )

  // Helper to extract contact from member
  const getContactFromMember = useCallback(
    (member: IWaitingListMember | IContact): IContact => {
      return isWaitingListMember(member) ? member.contact : member
    },
    [isWaitingListMember],
  )

  // Helper to get member ID for deletion
  const getMemberId = useCallback(
    (member: IWaitingListMember | IContact): string => {
      return isWaitingListMember(member) ? member.contact.id : member.id
    },
    [isWaitingListMember],
  )

  // Fetch waiting list data
  const fetchWaitingList = useCallback(async () => {
    if (!token || !params.id) return

    try {
      const [waitingLists, members, waitingListStatuses] = await Promise.all([
        fetchApi(`${apiUrl}/waiting-lists/${params.id}`, token, nodeEnv),
        fetchApi(`${apiUrl}/waiting-lists/${params.id}/members`, token, nodeEnv),
        fetchApi(`${apiUrl}/waiting-lists/member-statuses`, token, nodeEnv),
      ])

      setWaitingList(waitingLists)
      setMembers(members.members || [])
      setMemberStatuses([{ value: 'all', label: 'All' }, ...waitingListStatuses.items])
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }, [token, params.id, apiUrl, nodeEnv, handleApiError])

  // Fetch members by status
  const fetchMembersByStatus = useCallback(
    async (status: string) => {
      if (!token || !params.id) return

      setIsLoadingByStatus(true)

      try {
        const url =
          status === 'all'
            ? `${apiUrl}/waiting-lists/${params.id}/members`
            : `${apiUrl}/waiting-lists/${params.id}/members/by-status/${status}`

        const response = await fetchApi(url, token, nodeEnv)

        if (status === 'all') {
          setMembers((response.members || []) as IWaitingListMember[])
        } else {
          setMembers((response.members || response || []) as IContact[])
        }
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoadingByStatus(false)
      }
    },
    [token, params.id, apiUrl, nodeEnv, handleApiError],
  )

  const handleDeleteClick = useCallback((member: IWaitingListMember | IContact) => {
    setSelectedMember(member)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteMemberConfirm = useCallback(() => {
    if (!selectedMember || !token || !waitingList?.id) return

    const formData = new FormData()
    formData.append('intent', 'delete_member_by_id')
    formData.append('waiting_list_id', waitingList.id)
    formData.append('member_id', getMemberId(selectedMember))
    formData.append('token', token)

    deleteFetcher.submit(formData, {
      method: 'POST',
    })
  }, [selectedMember, token, waitingList?.id, getMemberId, deleteFetcher])

  const handleDeleteMembersConfirm = useCallback(() => {
    if (!waitingList?.id || !token) return

    const formData = new FormData()
    formData.append('intent', 'delete_all_member')
    formData.append('waiting_list_id', waitingList.id)
    formData.append('token', token)

    deleteFetcher.submit(formData, {
      method: 'POST',
    })
  }, [waitingList?.id, token, deleteFetcher])

  const handleChangeStatus = useCallback(
    async (status: string) => {
      setMemberStatus(status)
      await fetchMembersByStatus(status)
    },
    [fetchMembersByStatus],
  )

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false)
    if (deleteFetcher.state === 'idle') {
      setSelectedMember(null)
    }
  }, [deleteFetcher.state])

  const hasData = useMemo(() => {
    return members && members.length > 0
  }, [members])

  // Memoized columns definition with optimized cell renderers
  const columns: ColumnDef<IWaitingListMember | IContact>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ table }) => (
          <Checkbox
            className={cn('!mt-1 rounded-none', !hasData && 'hidden')}
            checked={
              table.getIsAllRowsSelected()
                ? true
                : table.getIsSomeRowsSelected()
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label="Select all members"
            tabIndex={0}
          />
        ),
        size: 20,
        cell: ({ row }) => {
          const member = row.original
          const isMember = isWaitingListMember(member)
          const contact = getContactFromMember(member)
          const status = isMember ? member.status : undefined

          return (
            <div className="flex items-center">
              <Checkbox
                className="rounded-none"
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select member"
                tabIndex={0}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="px-0 hover:bg-transparent"
                    aria-label="Open actions"
                    tabIndex={0}>
                    <EllipsisVertical size={18} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" side="right" className="w-44 p-2">
                  {isMember && status && (
                    <Button
                      variant="ghost"
                      onClick={() => updateMemberRef.current?.onOpen(contact, status)}
                      aria-label="Update status"
                      tabIndex={0}
                      className="flex w-full justify-start gap-2">
                      <Edit size={18} />
                      <span>Update Status</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="flex w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDeleteClick(member)}
                    aria-label="Delete member"
                    tabIndex={0}>
                    <Trash2 size={18} />
                    <span>Delete</span>
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          )
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 300,
        cell: ({ row }) => {
          const contact = getContactFromMember(row.original)
          const { email, id } = contact

          if (!email) return <span className="text-muted-foreground">-</span>
          return (
            <div className="inline">
              <Link to={`/contacts/${id}`} className="button-link">
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
          const member = row.original
          const status = isWaitingListMember(member) ? member.status : memberStatus
          return <StatusBadge status={status} />
        },
      },
      {
        accessorKey: 'first_name',
        header: 'Name',
        size: 300,
        cell: ({ row }) => {
          const contact = getContactFromMember(row.original)
          const { first_name, last_name } = contact
          const fullName = [first_name, last_name].filter(Boolean).join(' ')
          return <span className="text-left">{fullName || '-'}</span>
        },
      },
      {
        accessorKey: 'contact_type',
        header: 'Contact Type',
        cell: ({ row }) => {
          const contact = getContactFromMember(row.original)
          const { contact_type } = contact
          return (
            <span className="text-left text-sm capitalize">{contact_type || '-'}</span>
          )
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => {
          const contact = getContactFromMember(row.original)
          const { phone, phone_type } = contact
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
    ],
    [memberStatus, isWaitingListMember, getContactFromMember, handleDeleteClick, hasData],
  )

  // Create table instance with row selection
  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    getRowId: (row) => {
      const member = row as IWaitingListMember | IContact
      return getMemberId(member)
    },
  })

  // Get selected contacts
  const selectedContacts = useMemo(() => {
    const selectedRowIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id as keyof typeof rowSelection],
    )
    return members
      .filter((member) => selectedRowIds.includes(getMemberId(member)))
      .map((member) => getContactFromMember(member))
  }, [rowSelection, members, getMemberId, getContactFromMember])

  const handleBulkUpdateStatus = useCallback(() => {
    if (selectedContacts.length > 0) {
      updateMemberRef.current?.onOpenBulk(selectedContacts)
    }
  }, [selectedContacts])

  // Memoized empty content components
  const handleOpenNewMember = useCallback(() => {
    newMemberRef.current?.onOpen()
  }, [])

  const emptyContent = useMemo(
    () => (
      <EmptyContent
        image="/images/empty-contacts.svg"
        title="No members found"
        description="Get started by adding your first member">
        <Button variant="black" onClick={handleOpenNewMember}>
          New Member
        </Button>
      </EmptyContent>
    ),
    [handleOpenNewMember],
  )

  const emptyContentByStatus = useMemo(
    () => (
      <EmptyContent
        image="/images/empty-contacts.svg"
        title="No members found"
        description={`No members found for ${memberStatus}`}
      />
    ),
    [memberStatus],
  )

  // Initial data fetch
  useEffect(() => {
    fetchWaitingList()
  }, [fetchWaitingList])

  // Handle delete fetcher response
  useEffect(() => {
    if (!deleteFetcher.data) return

    handleFetcherData(deleteFetcher.data, (responseData) => {
      if (responseData.intent === 'delete_member_by_id') {
        setMembers((prevData) => {
          if (!prevData) return prevData

          // Maintain the array type based on memberStatus
          if (memberStatus === 'all') {
            return (prevData as IWaitingListMember[]).filter(
              (item) => item.contact.id !== responseData.id,
            )
          }
          return (prevData as IContact[]).filter((item) => item.id !== responseData.id)
        })
        setIsDeleteDialogOpen(false)
        setSelectedMember(null)
      }

      if (responseData.intent === 'delete_all_member') {
        setMembers([])
        setIsDeleteAllDialogOpen(false)
      }
    })
  }, [deleteFetcher.data])

  // Handle new member fetcher response
  useEffect(() => {
    if (!newMemberFetcher.data) return

    handleFetcherData(newMemberFetcher.data, () => {
      newMemberRef.current?.onClose()
      fetchWaitingList()
    })
  }, [newMemberFetcher.data, fetchWaitingList])

  // Handle update member status fetcher response
  useEffect(() => {
    if (!updateMemberFetcher.data) return

    handleFetcherData(updateMemberFetcher.data, async (responseData) => {
      updateMemberRef.current?.onClose()

      // Clear row selection after update
      setRowSelection({})

      // Only update status if we're showing all members (IWaitingListMember[])
      if (memberStatus === 'all') {
        if (responseData.intent === 'update_member_waiting_list_status_bulk') {
          // Bulk update - refresh the data
          await fetchMembersByStatus(memberStatus)
        } else {
          // Single update
          setMembers((prevData) => {
            if (!prevData) return prevData
            return (prevData as IWaitingListMember[]).map((item) => {
              if (item.contact.id === responseData.contact_id) {
                return { ...item, status: responseData.status }
              }
              return item
            })
          })
        }
      } else {
        // If filtered, refresh the data to reflect the updated status
        await fetchMembersByStatus(memberStatus)
      }
    })
  }, [updateMemberFetcher.data, fetchMembersByStatus])

  if (isLoading) {
    return <AppPreloader />
  }

  if (!waitingList) {
    return (
      <div className="flex h-full animate-slide-up items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Waiting list not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto h-full max-w-screen-lg animate-slide-up">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold lg:text-3xl">Waiting List Details</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/waiting-lists/${params.id}/edit`)}>
              <Edit /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pt-4">
          <div className="d-list">
            <div className="d-item">
              <dt className="d-label">Name</dt>
              <dd className="d-content">{waitingList.name || 'N/A'}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Description</dt>
              <dd className="d-content">{waitingList.description || 'N/A'}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Created At</dt>
              <dd className="d-content">
                {format(new Date(waitingList.created_at + 'z'), 'PPPpp')}
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Updated At</dt>
              <dd className="d-content">
                {format(new Date(waitingList.updated_at + 'z'), 'PPPpp')}
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold lg:text-2xl">Members</h1>
            <div className="flex items-center gap-2">
              {selectedContacts.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBulkUpdateStatus}
                  aria-label="Update selected members status"
                  tabIndex={0}>
                  <Edit size={16} className="mr-1" />
                  Update Bulk Status ({selectedContacts.length})
                </Button>
              )}
              {(hasData || memberStatus !== 'all') && (
                <CreateButton label="New Members" onClick={handleOpenNewMember} />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!hasData && memberStatus === 'all' && !isLoadingByStatus ? (
            emptyContent
          ) : (
            <div className="animate-slide-up">
              <Tabs
                className={cn(
                  'mb-3',
                  memberStatus === 'all' && members.length === 0 && 'hidden',
                )}
                defaultValue={memberStatus}
                onValueChange={(value) => handleChangeStatus(value)}>
                <TabsList>
                  {memberStatuses.map((status) => {
                    return (
                      <TabsTrigger key={status.value} value={status.value}>
                        {status.label}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>
              <DataTable
                columns={columns}
                data={members || []}
                fixed={false}
                isLoading={isLoadingByStatus}
                empty={emptyContentByStatus}
                table={table}
              />
            </div>
          )}
        </CardContent>

        {hasData && (
          <CardFooter className="justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteAllDialogOpen(true)}>
              Delete All Members
            </Button>
          </CardFooter>
        )}
      </Card>

      <DeleteConfirmation
        open={isDeleteDialogOpen}
        onOpenChange={handleCloseDeleteDialog}
        title="Remove Member"
        description={`This will remove "${
          selectedMember ? getContactFromMember(selectedMember).email : ''
        }" from your member waiting list. This action cannot be undone.`}
        onDelete={handleDeleteMemberConfirm}
        fetcher={deleteFetcher}
      />

      <DeleteConfirmation
        open={isDeleteAllDialogOpen}
        onOpenChange={setIsDeleteAllDialogOpen}
        title="Remove All Members"
        description={`This will remove all members from your waiting list "${waitingList?.name}". This action cannot be undone.`}
        onDelete={handleDeleteMembersConfirm}
        fetcher={deleteFetcher}
      />

      <NewMemberWaitingList
        ref={newMemberRef}
        fetcher={newMemberFetcher}
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv}
        memberStatuses={memberStatuses.filter((status) => status.value !== 'all')}
      />

      <UpdateMemberWaitingListStatus
        ref={updateMemberRef}
        fetcher={updateMemberFetcher}
        memberStatuses={memberStatuses.filter((status) => status.value !== 'all')}
      />
    </div>
  )
}

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const intent = formData.get('intent')
  const token = formData.get('token') as string
  const memberId = formData.get('member_id')
  const waitingListId = formData.get('waiting_list_id')
  const contactIds = formData.get('contact_ids')
  const status = formData.get('status')
  const contact_id = formData.get('contact_id')

  try {
    if (intent === 'delete_member_by_id' && memberId) {
      const url = `${apiUrl}/waiting-lists/${waitingListId}/members/${memberId}`

      await fetchApi(url, token, nodeEnv, {
        method: 'DELETE',
      })

      return Response.json(
        {
          toast: {
            type: 'success',
            title: 'Success',
            description: 'Successfully removed member',
          },
          response: { id: memberId, intent },
        },
        { status: 200 },
      )
    }

    if (intent === 'delete_all_member' && waitingListId) {
      const url = `${apiUrl}/waiting-lists/${waitingListId}/members`

      await fetchApi(url, token, nodeEnv, {
        method: 'DELETE',
      })

      return Response.json(
        {
          toast: {
            type: 'success',
            title: 'Success',
            description: 'Successfully removed member',
          },
          response: { intent },
        },
        { status: 200 },
      )
    }

    if (intent === 'new_member_waiting_list') {
      const url = `${apiUrl}/waiting-lists/${waitingListId}/members`

      const response = await fetchApi(url, token, nodeEnv, {
        method: 'POST',
        body: JSON.stringify({ contact_ids: JSON.parse(contactIds as string), status }),
      })

      return Response.json(
        {
          toast: {
            type: 'success',
            title: 'Success',
            description: response.message,
          },
          response: { intent },
        },
        { status: 200 },
      )
    }

    if (intent === 'update_member_waiting_list_status') {
      const url = `${apiUrl}/waiting-lists/${waitingListId}/members/${contact_id}/status?status=${status}`

      const response = await fetchApi(url, token, nodeEnv, {
        method: 'PUT',
      })

      return Response.json(
        {
          toast: {
            type: 'success',
            title: 'Success',
            description: response.message,
          },
          response: { intent, status, contact_id },
        },
        { status: 200 },
      )
    }

    if (intent === 'update_member_waiting_list_status_bulk') {
      const contactIds = JSON.parse(formData.get('contact_ids') as string)
      const url = `${apiUrl}/waiting-lists/${waitingListId}/members/bulk-status?status=${status}`

      const response = await fetchApi(url, token, nodeEnv, {
        method: 'POST',
        body: JSON.stringify([...contactIds]),
      })

      return Response.json(
        {
          toast: {
            type: 'success',
            title: 'Success',
            description: response.message || 'Successfully updated member statuses',
          },
          response: { intent, status, contact_ids: contactIds },
        },
        { status: 200 },
      )
    }
  } catch (error: any) {
    const convertError = JSON.parse(error?.message)

    return redirectWithToast(`/waiting-lists/${waitingListId}`, {
      type: 'error',
      title: 'Error',
      description: `${convertError.status} - ${convertError.error}`,
    })
  }
}
