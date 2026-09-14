import { DataTable } from '@/components/data-table'
import EmptyContent from '@/components/empty-content/empty-content'
import { ApiErrorOverlay } from '@/components/misc/api-error-overlay'
import { ContactStatusBadge } from '@/components/contact-status/contact-status'
import { useSegmentContacts } from '@/resources/hooks/segments'
import { ContactType } from '@/resources/queries/contacts/contact.type'
import { ResourceID, useApp } from 'tessera-ui'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import type { LoaderFunctionArgs } from 'react-router'
import { Link, useLoaderData, useParams } from 'react-router'
import { Badge } from '@shadcn/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

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

export default function SegmentContacts() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const params = useParams()
  const segmentId = params.segment_id || ''

  const config = { apiUrl: apiUrl!, nodeEnv, token: token! }

  const { data, isLoading, apiError } = useSegmentContacts(
    config,
    segmentId,
    { page, size },
    { enabled: !!segmentId && !!token }
  )

  const columns: ColumnDef<ContactType>[] = useMemo(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
          const email = row.original.email
          if (!email) return <span className="text-muted-foreground">-</span>
          return (
            <Link to={`/contacts/${row.original.id}`} className="button-link">
              <span className="text-sm">{email}</span>
            </Link>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        cell: ({ row }) => <ContactStatusBadge status={row.original.status} />,
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
        accessorKey: 'id',
        header: 'ID',
        size: 20,
        cell: ({ row }) => <ResourceID value={row.original.id} />,
      },
    ],
    []
  )

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No matching contacts"
      description="No contacts currently match this segment's rule."
    />
  )

  return (
    <div className="animate-slide-up h-full">
      {apiError ? (
        <ApiErrorOverlay
          statusCode={apiError?.statusCode ?? 403}
          message={apiError?.message ?? 'Access denied.'}
          rawMessage={apiError?.rawMessage}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          isLoading={isLoading}
          empty={emptyContent}
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
  )
}
