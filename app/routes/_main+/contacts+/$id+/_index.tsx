import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import { useApp } from '@/context/AppContext'
import { useContactDetail, useDeleteContact } from '@/resources/hooks/contacts'
import { useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { format } from 'date-fns'
import { Contact, Edit, EllipsisVertical, MapPin, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import ContactInteractionShortcut from '@/components/dialog/contact-interaction-shorcut'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactDetail() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const contactInteractionRef =
    useRef<React.ComponentRef<typeof ContactInteractionShortcut>>(null)

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const { data: contact, isLoading } = useContactDetail(config, params.id!, {
    enabled: !!params.id && !!token,
  })

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
      <div className="flex h-full animate-slide-up items-center justify-center">
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

  return (
    <div className="flex h-full animate-slide-up flex-col gap-4">
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
                      className="flex w-full justify-start gap-2"
                      onClick={() => {
                        contactInteractionRef.current?.onOpen(contact)
                      }}>
                      <Contact size={18} />
                      <span>Interaction</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground"
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
                          <span className="text-muted-foreground">
                            ({contact.phone_type})
                          </span>
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
                  <dd className="d-content capitalize">
                    {contact.contact_type || 'N/A'}
                  </dd>
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
                  <MapPin className="mt-0.5 text-muted-foreground" size={20} />
                  <div className="space-y-1">
                    {contact.address_line_1 && (
                      <p className="text-sm">{contact.address_line_1}</p>
                    )}
                    {contact.address_line_2 && (
                      <p className="text-sm">{contact.address_line_2}</p>
                    )}
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
              <p className="whitespace-pre-wrap text-sm">{contact.notes || 'N/A'}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmation ref={deleteModalRef} />
      <ContactInteractionShortcut
        ref={contactInteractionRef}
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv}
      />
    </div>
  )
}
