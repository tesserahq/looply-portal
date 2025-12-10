import { AppPreloader } from '@/components/loader/pre-loader'
import NewButton from '@/components/new-button/new-button'
import { DataTable } from '@/components/data-table'
import { NewMemberWaitingList, UpdateMemberWaitingListStatus } from '@/components/dialog'
import EmptyContent from '@/components/empty-content/empty-content'
import { WaitingListStatusBadge } from '@/components/waiting-list-status/waiting-list-status'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@shadcn/ui/card'
import { Checkbox } from '@shadcn/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@shadcn/ui/tabs'
import { useApp } from '@/context/AppContext'
import {
  useWaitingListDetail,
  useWaitingListMembers,
  useWaitingListMembersByStatus,
  useWaitingListStatuses,
  useRemoveWaitingListMember,
  useRemoveAllWaitingListMembers,
  useAddWaitingListMembers,
  useUpdateWaitingListMemberStatus,
  useBulkUpdateWaitingListMemberStatus,
  useDeleteWaitingList,
} from '@/resources/hooks/waiting-lists'
import {
  WaitingListMemberType,
  WaitingListStatusType,
} from '@/resources/queries/waiting-lists'
import { cn } from '@/utils/misc'
import { Link, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { ColumnDef, useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Edit, EllipsisVertical, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ContactType } from '@/resources/queries/contacts'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function WaitingListDetail() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const deleteAllModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const deleteWaitingListModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const newMemberRef = useRef<React.ElementRef<typeof NewMemberWaitingList>>(null)
  const updateMemberRef =
    useRef<React.ElementRef<typeof UpdateMemberWaitingListStatus>>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [memberStatus, setMemberStatus] = useState<string>('all')

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const waitingListId = params.id || ''

  const { data: waitingList, isLoading: isLoadingWaitingList } = useWaitingListDetail(
    config,
    waitingListId,
    {
      enabled: !!waitingListId && !!token,
    },
  )

  const { data: allMembers = [], isLoading: isLoadingAllMembers } = useWaitingListMembers(
    config,
    waitingListId,
    {
      enabled: !!waitingListId && !!token && memberStatus === 'all',
    },
  )

  const { data: membersByStatus = [], isLoading: isLoadingMembersByStatus } =
    useWaitingListMembersByStatus(config, waitingListId, memberStatus, {
      enabled: !!waitingListId && !!token && memberStatus !== 'all',
    })

  const { data: statusesData = [] } = useWaitingListStatuses(config, {
    enabled: !!token,
  })

  const members =
    memberStatus === 'all'
      ? allMembers
      : (membersByStatus as WaitingListMemberType[] | ContactType[])
  const isLoadingMembers =
    memberStatus === 'all' ? isLoadingAllMembers : isLoadingMembersByStatus
  const isLoading = isLoadingWaitingList || isLoadingMembers

  const memberStatuses: WaitingListStatusType[] = useMemo(() => {
    return [{ value: 'all', label: 'All', description: '' }, ...statusesData]
  }, [statusesData])

  const hasData = useMemo(() => {
    return members && members.length > 0
  }, [members])

  // Type guard helper
  const isWaitingListMember = useCallback(
    (member: WaitingListMemberType | ContactType): member is WaitingListMemberType => {
      return 'contact' in member && 'status' in member
    },
    [],
  )

  // Helper to extract contact from member
  const getContactFromMember = useCallback(
    (member: WaitingListMemberType | ContactType): ContactType => {
      return isWaitingListMember(member) ? member.contact : member
    },
    [isWaitingListMember],
  )

  // Helper to get member ID for deletion
  const getMemberId = useCallback(
    (member: WaitingListMemberType | ContactType): string => {
      return isWaitingListMember(member) ? member.contact.id : member.id
    },
    [isWaitingListMember],
  )

  const { mutateAsync: removeMember } = useRemoveWaitingListMember(
    config,
    waitingListId,
    {
      onSuccess: () => {
        deleteModalRef.current?.close()
      },
    },
  )

  const { mutateAsync: removeAllMembers } = useRemoveAllWaitingListMembers(
    config,
    waitingListId,
    {
      onSuccess: () => {
        deleteAllModalRef.current?.close()
      },
    },
  )

  const { mutateAsync: addMembers } = useAddWaitingListMembers(config, waitingListId, {
    onSuccess: () => {
      newMemberRef.current?.onClose()
    },
  })

  const { mutateAsync: updateMemberStatus } = useUpdateWaitingListMemberStatus(
    config,
    waitingListId,
    {
      onSuccess: () => {
        updateMemberRef.current?.onClose()
        setRowSelection({})
      },
    },
  )

  const { mutateAsync: bulkUpdateMemberStatus } = useBulkUpdateWaitingListMemberStatus(
    config,
    waitingListId,
    {
      onSuccess: () => {
        updateMemberRef.current?.onClose()
        setRowSelection({})
      },
    },
  )

  const { mutate: deleteWaitingList } = useDeleteWaitingList(config, {
    onSuccess: () => {
      deleteWaitingListModalRef.current?.close()
      navigate('/waiting-lists')
    },
  })

  const handleDelete = useCallback(
    (member: WaitingListMemberType | ContactType) => {
      deleteModalRef.current?.open({
        title: 'Remove Member',
        description: `This will remove "${getContactFromMember(member).email}" from your member waiting list. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await removeMember(getMemberId(member))
        },
      })
    },
    [removeMember, getContactFromMember, getMemberId],
  )

  const handleDeleteAll = useCallback(() => {
    deleteAllModalRef.current?.open({
      title: 'Remove All Members',
      description: `This will remove all members from your waiting list "${waitingList?.name}". This action cannot be undone.`,
      onDelete: async () => {
        deleteAllModalRef.current?.updateConfig({ isLoading: true })
        await removeAllMembers()
      },
    })
  }, [removeAllMembers, waitingList?.name])

  const handleAddMembers = useCallback(
    async (contactIds: string[], status?: string) => {
      await addMembers({ contact_ids: contactIds, status })
    },
    [addMembers],
  )

  const handleUpdateStatus = useCallback(
    async (contactId: string, status: string) => {
      await updateMemberStatus({ memberId: contactId, data: { status } })
    },
    [updateMemberStatus],
  )

  const handleBulkUpdateStatus = useCallback(
    async (contactIds: string[], status: string) => {
      await bulkUpdateMemberStatus({ contact_ids: contactIds, status })
    },
    [bulkUpdateMemberStatus],
  )

  const handleChangeStatus = useCallback((status: string) => {
    setMemberStatus(status)
    setRowSelection({})
  }, [])

  const handleDeleteWaitingList = useCallback(() => {
    if (!waitingList) return

    deleteWaitingListModalRef.current?.open({
      title: 'Remove Waiting List',
      description: `This will remove "${waitingList.name}" from your waiting lists. This action cannot be undone.`,
      onDelete: async () => {
        deleteWaitingListModalRef.current?.updateConfig({ isLoading: true })
        await deleteWaitingList(waitingListId)
      },
    })
  }, [waitingList, waitingListId, deleteWaitingList])

  // Memoized columns definition with optimized cell renderers
  const columns: ColumnDef<WaitingListMemberType | ContactType>[] = useMemo(
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
          return (
            <div className="flex items-center">
              <Checkbox
                className="rounded-none"
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select member"
                tabIndex={0}
              />
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
          return <WaitingListStatusBadge status={status} />
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
      {
        accessorKey: 'id',
        header: '',
        size: 20,
        cell: ({ row }) => {
          const member = row.original
          const isMember = isWaitingListMember(member)
          const contact = getContactFromMember(member)
          const status = isMember ? member.status : undefined

          return (
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
              <PopoverContent align="start" side="left" className="w-40 space-y-1 p-2">
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
                  onClick={() => handleDelete(member)}
                  aria-label="Delete member"
                  tabIndex={0}>
                  <Trash2 size={18} />
                  <span>Delete</span>
                </Button>
              </PopoverContent>
            </Popover>
          )
        },
      },
    ],
    [memberStatus, isWaitingListMember, getContactFromMember, handleDelete, hasData],
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
      const member = row as WaitingListMemberType | ContactType
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

  const handleBulkUpdateStatusClick = useCallback(() => {
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
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="px-0">
                  <EllipsisVertical size={18} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="left" className="w-40 p-2">
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/waiting-lists/${params.id}/edit`)}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleDeleteWaitingList}>
                  <Trash2 size={18} />
                  <span>Delete</span>
                </Button>
              </PopoverContent>
            </Popover>
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
                  onClick={handleBulkUpdateStatusClick}
                  aria-label="Update selected members status"
                  tabIndex={0}>
                  <Edit size={16} className="mr-1" />
                  Update Bulk Status ({selectedContacts.length})
                </Button>
              )}
              {(hasData || memberStatus !== 'all') && (
                <NewButton label="New Members" onClick={handleOpenNewMember} />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!hasData && memberStatus === 'all' && !isLoadingMembers ? (
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
                isLoading={isLoadingMembers}
                empty={emptyContentByStatus}
                table={table}
              />
            </div>
          )}
        </CardContent>

        {hasData && (
          <CardFooter className="justify-end">
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              Delete All Members
            </Button>
          </CardFooter>
        )}
      </Card>

      <DeleteConfirmation ref={deleteModalRef} />
      <DeleteConfirmation ref={deleteAllModalRef} />
      <DeleteConfirmation ref={deleteWaitingListModalRef} />

      <NewMemberWaitingList
        ref={newMemberRef}
        onAddMembers={handleAddMembers}
        memberStatuses={memberStatuses.filter((status) => status.value !== 'all')}
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv}
      />

      <UpdateMemberWaitingListStatus
        ref={updateMemberRef}
        onUpdateStatus={handleUpdateStatus}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        memberStatuses={memberStatuses.filter((status) => status.value !== 'all')}
      />
    </div>
  )
}
