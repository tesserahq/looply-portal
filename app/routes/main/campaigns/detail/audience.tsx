import { AppPreloader } from '@/components/loader/pre-loader'
import { DataTable } from '@/components/data-table'
import EmptyContent from '@/components/empty-content/empty-content'
import { Badge } from '@shadcn/ui/badge'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { useApp } from 'tessera-ui'
import { useCampaignDetail } from '@/resources/hooks/campaigns'
import { useContactListMembers } from '@/resources/hooks/contact-lists'
import { ContactListMemberType } from '@/resources/queries/contact-lists'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import { Link, useLoaderData, useParams } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

export function loader({ request }: LoaderFunctionArgs) {
  const canonical = ensureCanonicalPagination(request, {
    defaultSize: 25,
    defaultPage: 1,
  })

  if (canonical instanceof Response) return canonical

  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv, size: canonical.size, page: canonical.page }
}

export default function CampaignAudience() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const params = useParams()

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const campaignId = params.campaign_id || ''

  const { data: campaign, isLoading: isLoadingCampaign } = useCampaignDetail(config, campaignId, {
    enabled: !!campaignId && !!token,
  })

  const contactListId = campaign?.contact_list_id ?? ''

  const { data: membersData, isLoading: isLoadingMembers } = useContactListMembers(
    config,
    contactListId,
    { page, size },
    {
      enabled: !!contactListId && !!token,
    }
  )

  const members = membersData?.items ?? []

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
          return <Badge variant="outline">{row.original.is_active ? 'Active' : 'Inactive'}</Badge>
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
    ],
    []
  )

  const hasData = useMemo(() => members.length > 0, [members])

  const isLoading = isLoadingCampaign || isLoadingMembers

  if (isLoading) {
    return <AppPreloader />
  }

  if (!campaign) {
    return (
      <div className="animate-slide-up flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Campaign not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No audience found"
      description="This campaign's contact list has no members yet."
    />
  )

  return (
    <div className="animate-slide-up h-full space-y-3">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold lg:text-2xl">Audience</h1>
        </CardHeader>

        <CardContent>
          {!hasData ? (
            emptyContent
          ) : (
            <div className="animate-slide-up">
              <DataTable
                columns={columns}
                data={members}
                fixed={false}
                meta={{
                  page: membersData?.page || 1,
                  pages: membersData?.pages || 1,
                  size: membersData?.size || 1,
                  total: membersData?.total || 0,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
