import { DataTable } from '@/components/data-table'
import { DateTime } from '@/components/datetime'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import ContactInteractionShortcut from '@/components/dialog/contact-interaction-shorcut'
import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import NewButton from '@/components/new-button/new-button'
import { useApp } from '@/context/AppContext'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/shadcn/ui/tooltip'
import { useContactInteractionsByContactId } from '@/resources/hooks/contact-interactions'
import { useContactDetail, useDeleteContact } from '@/resources/hooks/contacts'
import { ContactInteractionType } from '@/resources/queries/contact-interactions'
import { ensureCanonicalPagination } from '@/utils/pagination.server'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Edit, EllipsisVertical, MapPin, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

const contactInteractionColumns: ColumnDef<ContactInteractionType>[] = [
  {
    accessorKey: 'note',
    header: 'Notes',
    cell: ({ row }) => {
      const { note } = row.original
      if (!note) return <span className="text-muted-foreground">-</span>
      return (
        <Link to={`/contact-interactions/${row.original.id}`} className="button-link">
          <span className="line-clamp-2 text-sm">{note}</span>
        </Link>
      )
    },
  },
  {
    accessorKey: 'action',
    header: 'Action',
    size: 140,
    cell: ({ row }) => {
      const { action, custom_action_description } = row.original

      if (action === 'custom') {
        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Badge variant="outline">{action}</Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span>{custom_action_description || '-'}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }

      return action ? <Badge variant="outline">{action}</Badge> : '-'
    },
  },
  {
    accessorKey: 'interaction_timestamp',
    header: 'Interaction Time',
    size: 150,
    cell: ({ row }) => {
      const { interaction_timestamp } = row.original
      if (!interaction_timestamp) return <span className="text-muted-foreground">-</span>
      return <DateTime date={interaction_timestamp} formatStr="PPpp" />
    },
  },
  {
    accessorKey: 'action_timestamp',
    header: 'Action Time',
    size: 150,
    cell: ({ row }) => {
      const { action_timestamp } = row.original
      if (!action_timestamp) return <span className="text-muted-foreground">-</span>
      return <DateTime date={action_timestamp} formatStr="PPpp" />
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    size: 150,
    cell: ({ row }) => {
      const { created_at } = row.original
      if (!created_at) return <span className="text-muted-foreground">-</span>
      return <DateTime date={created_at} />
    },
  },
]

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

export default function ContactDetail() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const contactInteractionRef = useRef<React.ComponentRef<typeof ContactInteractionShortcut>>(null)

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const { data: contact, isLoading } = useContactDetail(config, params.id!, {
    enabled: !!params.id && !!token,
  })

  const { data: interactions, isLoading: isLoadingInteractions } =
    useContactInteractionsByContactId(
      config,
      params.id!,
      {
        page,
        size,
      },
      {
        enabled: !!params.id && !!token,
      }
    )

  const { mutate: deleteContact, isPending: isDeleting } = useDeleteContact(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/contacts')
    },
  })

  const handleDelete = useCallback(() => {
    if (!params.id) return

    deleteModalRef.current?.open({
      title: 'Remove Contact',
      description: `This will remove "${contact?.email}" from your contacts. This action cannot be undone.`,
      onDelete: async () => {
        deleteModalRef.current?.updateConfig({ isLoading: true })
        await deleteContact(params.id!)
      },
      isLoading: false,
    })
  }, [params.id, contact?.email, deleteContact])

  useEffect(() => {
    if (isDeleting) {
      deleteModalRef.current?.updateConfig({ isLoading: true })
    }
  }, [isDeleting])

  if (isLoading) {
    return <AppPreloader />
  }

  if (!contact) {
    return (
      <div className="animate-slide-up flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Contact not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = [contact.first_name, contact.middle_name, contact.last_name]
    .filter(Boolean)
    .join(' ')

  const hasInteractions = Boolean(interactions?.items?.length)

  return (
    <div className="animate-slide-up flex h-full flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main Contact Information */}
        <div className="space-y-5 lg:col-span-2">
          {/* Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-start gap-3">
                  <h1 className="text-xl font-bold lg:text-3xl">Contact Details</h1>
                </div>
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
                      onClick={() => navigate(`/contacts/${params.id}/edit`)}>
                      <Edit size={18} />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="hover:bg-destructive hover:text-destructive-foreground flex w-full
                        justify-start gap-2"
                      onClick={handleDelete}>
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
                  <dt className="d-label">Email</dt>
                  <dd className="d-content">{contact.email}</dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">State</dt>
                  <dd className="d-content">
                    <Badge variant={contact?.is_active ? 'active' : 'outline'}>
                      {contact.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Full Name</dt>
                  <dd className="d-content">{fullName || 'N/A'}</dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Phone</dt>
                  <dd className="d-content">
                    {contact.phone ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{contact.phone}</span>
                        {contact.phone_type && (
                          <span className="text-muted-foreground">({contact.phone_type})</span>
                        )}
                      </div>
                    ) : (
                      <span>N/A</span>
                    )}
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Website</dt>
                  <dd className="d-content">
                    {contact.website ? (
                      <a
                        href={
                          contact.website.startsWith('http://') ||
                          contact.website.startsWith('https://')
                            ? contact.website
                            : `https://${contact.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline">
                        {contact.website}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Company</dt>
                  <dd className="d-content">{contact.company || 'N/A'}</dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Job</dt>
                  <dd className="d-content">{contact.job || 'N/A'}</dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Contact Type</dt>
                  <dd className="d-content capitalize">{contact.contact_type || 'N/A'}</dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Created At</dt>
                  <dd className="d-content">
                    {format(new Date(contact.created_at + 'z'), 'PPPpp')}
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Updated At</dt>
                  <dd className="d-content">
                    {format(new Date(contact.updated_at + 'z'), 'PPPpp')}
                  </dd>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Interactions</CardTitle>
                {hasInteractions && (
                  <NewButton
                    label="New Contact Interaction"
                    onClick={() => {
                      contactInteractionRef.current?.onOpen(contact)
                    }}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!hasInteractions && !isLoadingInteractions ? (
                <div className="border-border rounded border border-dashed p-6">
                  <EmptyContent
                    image="/images/empty-contacts.svg"
                    title="No interactions yet"
                    description="Interactions for this contact will appear here once created">
                    <Button
                      variant="black"
                      onClick={() => {
                        contactInteractionRef.current?.onOpen(contact)
                      }}>
                      Create Interaction
                    </Button>
                  </EmptyContent>
                </div>
              ) : (
                <DataTable
                  columns={contactInteractionColumns}
                  data={interactions?.items || []}
                  meta={{
                    page: interactions?.page || 1,
                    pages: interactions?.pages || 1,
                    size: interactions?.size || 1,
                    total: interactions?.total || 0,
                  }}
                  fixed={false}
                  isLoading={isLoadingInteractions}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Address and Notes */}
        <div className="space-y-4 lg:col-span-1">
          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              {contact.address_line_1 ||
              contact.address_line_2 ||
              contact.city ||
              contact.state ||
              contact.country ||
              contact.zip_code ? (
                <div className="flex items-start gap-3">
                  <MapPin className="text-muted-foreground mt-0.5" size={20} />
                  <div className="space-y-1">
                    {contact.address_line_1 && <p className="text-sm">{contact.address_line_1}</p>}
                    {contact.address_line_2 && <p className="text-sm">{contact.address_line_2}</p>}
                    <p className="text-sm">
                      {[contact.city, contact.state, contact.country, contact.zip_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm">N/A</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{contact.notes || 'N/A'}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmation ref={deleteModalRef} />
      <ContactInteractionShortcut ref={contactInteractionRef} apiUrl={apiUrl!} nodeEnv={nodeEnv} />
    </div>
  )
}
