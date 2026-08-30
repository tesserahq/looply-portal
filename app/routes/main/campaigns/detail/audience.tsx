import { AppPreloader } from '@/components/loader/pre-loader'
import { DataTable } from '@/components/data-table'
import EmptyContent from '@/components/empty-content/empty-content'
import { Badge } from '@shadcn/ui/badge'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { useApp } from 'tessera-ui'
import { DateTime } from 'tessera-ui/components'
import { useCampaignDetail, useCampaignRecipients } from '@/resources/hooks/campaigns'
import { useSegmentPreviewById } from '@/resources/hooks/segments'
import { CampaignRecipientType } from '@/resources/queries/campaigns'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import { Link, useLoaderData, useParams } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { ColumnDef } from '@tanstack/react-table'
import { Users } from 'lucide-react'
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

  // Recipients are only recorded once a campaign's send is accepted - a
  // draft campaign has none yet, so its audience is a live segment preview
  // (a prediction) rather than a recorded list.
  const hasBeenSent = !!campaign?.batch_id

  const { data: recipientsData, isLoading: isLoadingRecipients } = useCampaignRecipients(
    config,
    campaignId,
    { page, size },
    { enabled: !!campaignId && !!token && hasBeenSent }
  )

  const { data: segmentPreview, isLoading: isLoadingPreview } = useSegmentPreviewById(
    config,
    campaign?.segment_id ?? '',
    { enabled: !!campaign?.segment_id && !hasBeenSent }
  )

  const recipients = recipientsData?.items ?? []

  const columns: ColumnDef<CampaignRecipientType>[] = useMemo(
    () => [
      {
        accessorKey: 'contact.email',
        header: 'Email',
        size: 300,
        cell: ({ row }) => {
          const email = row.original.contact.email
          if (!email) return <span className="text-muted-foreground">-</span>
          return (
            <div className="inline">
              <Link to={`/contacts/${row.original.contact.id}`} className="button-link">
                <span className="text-sm">{email}</span>
              </Link>
            </div>
          )
        },
      },
      {
        accessorKey: 'contact.first_name',
        header: 'Name',
        size: 300,
        cell: ({ row }) => {
          const { first_name, last_name } = row.original.contact
          const fullName = [first_name, last_name].filter(Boolean).join(' ')
          return <span className="text-left">{fullName || '-'}</span>
        },
      },
      {
        accessorKey: 'opened_at',
        header: 'Opened',
        size: 150,
        cell: ({ row }) => {
          const { opened_at } = row.original
          if (!opened_at) return <Badge variant="outline">Not yet</Badge>
          return <DateTime date={opened_at} formatStr="dd/MM/yyyy HH:mm" />
        },
      },
      {
        accessorKey: 'clicked_at',
        header: 'Clicked',
        size: 150,
        cell: ({ row }) => {
          const { clicked_at } = row.original
          if (!clicked_at) return <Badge variant="outline">Not yet</Badge>
          return <DateTime date={clicked_at} formatStr="dd/MM/yyyy HH:mm" />
        },
      },
    ],
    []
  )

  const isLoading = isLoadingCampaign || (hasBeenSent ? isLoadingRecipients : isLoadingPreview)

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

  if (!hasBeenSent) {
    return (
      <div className="animate-slide-up h-full space-y-3">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold lg:text-2xl">Audience</h1>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <p>
                This is a draft - recipients are recorded once it&apos;s sent. Its segment currently
                matches <b>{segmentPreview?.contact_count ?? 0}</b>{' '}
                {segmentPreview?.contact_count === 1 ? 'contact' : 'contacts'}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasData = recipients.length > 0

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No audience found"
      description="This campaign has no recorded recipients."
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
                data={recipients}
                fixed={false}
                meta={{
                  page: recipientsData?.page || 1,
                  pages: recipientsData?.pages || 1,
                  size: recipientsData?.size || 1,
                  total: recipientsData?.total || 0,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
