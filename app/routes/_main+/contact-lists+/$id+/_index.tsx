import { AppPreloader } from '@/components/loader/pre-loader'
import NewButton from '@/components/new-button/new-button'
import { DataTable } from '@/components/data-table'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import NewMemberContactList from '@/components/dialog/new-member-contact-list'
import EmptyContent from '@/components/empty-content/empty-content'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { useApp } from '@/context/AppContext'
import {
  useContactListDetail,
  useContactListMembers,
  useRemoveContactListMember,
  useRemoveAllContactListMembers,
  useAddContactListMembers,
  useDeleteContactList,
} from '@/resources/hooks/contact-lists'
import { ContactListMemberType } from '@/resources/queries/contact-lists'
import { Link, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Edit, EllipsisVertical, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactListDetail() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const deleteAllModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const deleteContactListModalRef =
    useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const newMemberRef = useRef<React.ElementRef<typeof NewMemberContactList>>(null)

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const contactListId = params.id || ''

  const { data: contactList, isLoading: isLoadingContactList } = useContactListDetail(
    config,
    contactListId,
    {
      enabled: !!contactListId && !!token,
    },
  )

  const { data: members = [], isLoading: isLoadingMembers } = useContactListMembers(
    config,
    contactListId,
    {
      enabled: !!contactListId && !!token,
    },
  )

  const { mutateAsync: removeMember } = useRemoveContactListMember(
    config,
    contactListId,
    {
      onSuccess: () => {
        deleteModalRef.current?.close()
      },
    },
  )

  const { mutateAsync: removeAllMembers } = useRemoveAllContactListMembers(
    config,
    contactListId,
    {
      onSuccess: () => {
        deleteAllModalRef.current?.close()
      },
    },
  )

  const { mutateAsync: addMembers } = useAddContactListMembers(config, contactListId, {
    onSuccess: () => {
      newMemberRef.current?.onClose()
    },
  })

  const { mutate: deleteContactList } = useDeleteContactList(config, {
    onSuccess: () => {
      deleteContactListModalRef.current?.close()
      navigate('/contact-lists')
    },
  })

  const handleDelete = useCallback(
    (member: ContactListMemberType) => {
      deleteModalRef.current?.open({
        title: 'Remove Member',
        description: `This will remove "${member.email}" from your member contact list. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await removeMember(member.id)
        },
      })
    },
    [removeMember],
  )

  const handleDeleteAll = useCallback(() => {
    deleteAllModalRef.current?.open({
      title: 'Remove All Members',
      description: `This will remove all members from your contact list "${contactList?.name}". This action cannot be undone.`,
      onDelete: async () => {
        deleteAllModalRef.current?.updateConfig({ isLoading: true })
        await removeAllMembers()
      },
    })
  }, [removeAllMembers, contactList?.name])

  const handleAddMembers = useCallback(
    async (contactIds: string[]) => {
      await addMembers({ contact_ids: contactIds })
    },
    [addMembers],
  )

  const handleDeleteContactList = useCallback(() => {
    if (!contactList) return

    deleteContactListModalRef.current?.open({
      title: 'Remove Contact List',
      description: `This will remove "${contactList.name}" from your contact lists. This action cannot be undone.`,
      onDelete: async () => {
        deleteContactListModalRef.current?.updateConfig({ isLoading: true })
        await deleteContactList(contactListId)
      },
    })
  }, [contactList, contactListId, deleteContactList])

  const columns: ColumnDef<ContactListMemberType>[] = useMemo(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        size: 300,
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
        size: 300,
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
        accessorKey: 'id',
        header: '',
        size: 20,
        cell: ({ row }) => {
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="px-0">
                  <EllipsisVertical size={18} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="left" className="w-40 p-2">
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
    [handleDelete],
  )

  const hasData = useMemo(() => {
    return members && members.length > 0
  }, [members])

  const isLoading = isLoadingContactList || isLoadingMembers

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No members found"
      description="Get started by adding your first member">
      <Button variant="black" onClick={() => newMemberRef.current?.onOpen()}>
        New Member
      </Button>
    </EmptyContent>
  )

  if (isLoading) {
    return <AppPreloader />
  }

  if (!contactList) {
    return (
      <div className="flex h-full animate-slide-up items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Contact list not found</p>
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
            <h1 className="text-xl font-bold lg:text-3xl">Contact List Details</h1>
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
                  onClick={() => navigate(`/contact-lists/${params.id}/edit`)}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleDeleteContactList}>
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
              <dd className="d-content">{contactList.name || 'N/A'}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Description</dt>
              <dd className="d-content">{contactList.description || 'N/A'}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Visibility</dt>
              <dd className="d-content">
                <Badge variant={contactList.is_public ? 'public' : 'private'}>
                  {contactList.is_public ? 'Public' : 'Private'}
                </Badge>
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Created At</dt>
              <dd className="d-content">
                {format(new Date(contactList.created_at + 'z'), 'PPPpp')}
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Updated At</dt>
              <dd className="d-content">
                {format(new Date(contactList.updated_at + 'z'), 'PPPpp')}
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold lg:text-2xl">Members</h1>
            {hasData && (
              <NewButton
                label="New Members"
                onClick={() => newMemberRef.current?.onOpen()}
              />
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!hasData ? (
            emptyContent
          ) : (
            <div className="animate-slide-up">
              <DataTable columns={columns} data={members || []} fixed={false} />
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
      <DeleteConfirmation ref={deleteContactListModalRef} />

      <NewMemberContactList
        ref={newMemberRef}
        onAddMembers={handleAddMembers}
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv}
      />
    </div>
  )
}
