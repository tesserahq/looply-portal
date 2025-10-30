/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppPreloader } from '@/components/misc/AppPreloader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/context/AppContext'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi } from '@/libraries/fetch'
import { IContact } from '@/types/contact'
import { useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { format } from 'date-fns'
import { Edit, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactDetail() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const handleApiError = useHandleApiError()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [contact, setContact] = useState<IContact | null>(null)

  const fetchContact = async () => {
    if (!token) return

    try {
      const data = await fetchApi(`${apiUrl}/contacts/${params.id}`, token, nodeEnv)
      setContact(data)
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token && params.id) {
      fetchContact()
    }
  }, [token, params.id])

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
    <div className="grid h-full animate-slide-up gap-4 lg:grid-cols-3">
      {/* Main Contact Information */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-start gap-3">
                <h1 className="text-xl font-bold lg:text-3xl">Contact Details</h1>
                <Badge variant="outline">
                  {contact.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/contacts/${params.id}/edit`)}>
                <Edit /> Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pt-4">
            <div className="d-list">
              <div className="d-item">
                <dt className="d-label">Email</dt>
                <dd className="d-content">{contact.email}</dd>
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
  )
}
