/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppPreloader } from '@/components/misc/AppPreloader'
import CreateButton from '@/components/misc/CreateButton'
import { DataTable } from '@/components/misc/Datatable'
import DeleteConfirmation from '@/components/misc/Dialog/DeleteConfirmation'
import NewMemberContactList from '@/components/misc/Dialog/NewMemberContactList'
import EmptyContent from '@/components/misc/EmptyContent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { IContact } from '@/types/contact'
import { IContactList } from '@/types/contact-list'
import { handleFetcherData } from '@/utils/fetcher.data'
import { redirectWithToast } from '@/utils/toast.server'
import { Link, useFetcher, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { ActionFunctionArgs } from '@remix-run/router'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Edit, Ellipsis, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactListDetail() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const handleApiError = useHandleApiError()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [contactList, setContactList] = useState<IContactList | null>(null)
  const [members, setMembers] = useState<IContact[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState<boolean>(false)
  const [selectedMember, setSelectedMember] = useState<IContact | null>(null)
  const deleteFetcher = useFetcher()
  const newMemberFetcher = useFetcher()
  const newMemberRef = useRef<React.ElementRef<typeof NewMemberContactList>>(null)

  const handleDeleteClick = (contact: IContact) => {
    setSelectedMember(contact)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteMemberConfirm = () => {
    if (selectedMember && token) {
      const formData = new FormData()
      formData.append('intent', 'delete_member_by_id')
      formData.append('contact_list_id', contactList?.id || '')
      formData.append('member_id', selectedMember.id)
      formData.append('token', token)

      deleteFetcher.submit(formData, {
        method: 'POST',
      })
    }
  }

  const handleDeleteMembersConfirm = () => {
    if (contactList && token) {
      const formData = new FormData()
      formData.append('intent', 'delete_all_member')
      formData.append('contact_list_id', contactList.id)
      formData.append('token', token)

      deleteFetcher.submit(formData, {
        method: 'POST',
      })
    }
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    if (deleteFetcher.state === 'idle') {
      setSelectedMember(null)
    }
  }

  const columns: ColumnDef<IContact>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: '',
        size: 20,
        cell: ({ row }) => {
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
    ],
    [members],
  )

  const hasData = useMemo(() => {
    return members && members.length > 0
  }, [members])

  const fetchContactList = async () => {
    if (!token) return

    try {
      const [contactList, members] = await Promise.all([
        fetchApi(`${apiUrl}/contact-lists/${params.id}`, token, nodeEnv),
        fetchApi(`${apiUrl}/contact-lists/${params.id}/members`, token, nodeEnv),
      ])

      setContactList(contactList)
      setMembers(members.members || [])
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token && params.id) {
      fetchContactList()
    }
  }, [token, params.id])

  useEffect(() => {
    if (deleteFetcher.data) {
      handleFetcherData(deleteFetcher.data, (responseData) => {
        // delete member by id
        if (responseData.intent === 'delete_member_by_id') {
          setMembers((prevData) => {
            if (!prevData) return prevData
            return prevData.filter((item) => item.id !== responseData.id)
          })
          setIsDeleteDialogOpen(false)
          setSelectedMember(null)
        }

        // delete all member by contact-list id
        if (responseData.intent === 'delete_all_member') {
          setMembers([])
          setIsDeleteAllDialogOpen(false)
        }
      })
    }
  }, [deleteFetcher.data])

  useEffect(() => {
    if (newMemberFetcher.data) {
      handleFetcherData(newMemberFetcher.data, () => {
        newMemberRef.current?.onClose()
        fetchContactList() // reload after successfully add member
      })
    }
  }, [newMemberFetcher.data])

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/contact-lists/${params.id}/edit`)}>
              <Edit /> Edit
            </Button>
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
              <CreateButton
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
        description={`This will remove "${selectedMember?.email}" from your member contact list. This action cannot be undone.`}
        onDelete={handleDeleteMemberConfirm}
        fetcher={deleteFetcher}
      />

      <DeleteConfirmation
        open={isDeleteAllDialogOpen}
        onOpenChange={setIsDeleteAllDialogOpen}
        title="Remove All Members"
        description={`This will remove all members from your contact list "${contactList?.name}". This action cannot be undone.`}
        onDelete={handleDeleteMembersConfirm}
        fetcher={deleteFetcher}
      />

      <NewMemberContactList
        ref={newMemberRef}
        fetcher={newMemberFetcher}
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv}
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
  const contactListId = formData.get('contact_list_id')
  const contactIds = formData.get('contact_ids')

  try {
    if (intent === 'delete_member_by_id' && memberId) {
      const url = `${apiUrl}/contact-lists/${contactListId}/members/${memberId}`

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

    if (intent === 'delete_all_member' && contactListId) {
      const url = `${apiUrl}/contact-lists/${contactListId}/members`

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

    if (intent === 'new_contact_list') {
      const url = `${apiUrl}/contact-lists/${contactListId}/members`

      const response = await fetchApi(url, token, nodeEnv, {
        method: 'POST',
        body: JSON.stringify({ contact_ids: JSON.parse(contactIds as string) }),
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
  } catch (error: any) {
    const convertError = JSON.parse(error?.message)

    return redirectWithToast(`/contact-lists/${contactListId}`, {
      type: 'error',
      title: 'Error',
      description: `${convertError.status} - ${convertError.error}`,
    })
  }
}
