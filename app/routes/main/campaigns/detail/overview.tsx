import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import SendConfirmation from '@/components/send-confirmation/send-confirmation'
import { ApiErrorOverlay } from '@/components/misc/api-error-overlay'
import { CampaignStatusBadge } from '@/components/campaign-status/campaign-status'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { useApp } from 'tessera-ui'
import { DateTime, ResourceID } from 'tessera-ui/components'
import { useBroadcast } from '@/resources/hooks/broadcasts'
import {
  useCampaignDetail,
  useCampaignEngagementTimeline,
  useCampaignStats,
  useDeleteCampaign,
  useSendCampaign,
} from '@/resources/hooks/campaigns'
import { CampaignFunnelChart } from '@/components/campaign-analytics/campaign-funnel-chart'
import { CampaignEngagementTimelineChart } from '@/components/campaign-analytics/campaign-engagement-timeline-chart'
import { useSegmentDetail, useSegmentPreviewById } from '@/resources/hooks/segments'
import { useTemplate } from '@/resources/hooks/templates'
import { mergeTemplateIntoLayout } from '@/utils/helpers/layout.helper'
import { buildResourceUrl } from '@/utils/helpers/url.helper'
import { Link, useLoaderData, useNavigate, useParams } from 'react-router'
import { Edit, EllipsisVertical, Send, Trash2 } from 'lucide-react'
import { Activity, useCallback, useRef, useState } from 'react'

function formatRate(rate: number | undefined): string {
  if (rate === undefined) return 'N/A'
  return `${(rate * 100).toFixed(1)}%`
}

export function loader() {
  const apiUrl = process.env.API_URL
  const sendlyApiUrl = process.env.SENDLY_API_URL
  const sendlyHostUrl = process.env.SENDLY_HOST_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, sendlyApiUrl, sendlyHostUrl, nodeEnv }
}

export default function CampaignDetail() {
  const { apiUrl, sendlyApiUrl, sendlyHostUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const sendModalRef = useRef<React.ComponentRef<typeof SendConfirmation>>(null)
  const previewIframeRef = useRef<HTMLIFrameElement>(null)
  const [previewHeight, setPreviewHeight] = useState<number>()

  const handlePreviewLoad = () => {
    const doc = previewIframeRef.current?.contentDocument
    if (doc) setPreviewHeight(doc.documentElement.scrollHeight)
  }

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const sendlyConfig = {
    apiUrl: sendlyApiUrl!,
    nodeEnv,
    token: token!,
  }

  const campaignId = params.campaign_id || ''

  const { data: campaign, isLoading } = useCampaignDetail(config, campaignId, {
    enabled: !!campaignId && !!token,
  })

  const {
    data: template,
    isLoading: isLoadingTemplate,
    isError: isTemplateError,
    apiError: templateApiError,
  } = useTemplate(sendlyConfig, campaign?.template_id ?? '', {
    enabled: !!campaign?.template_id,
  })

  const { data: segment, isLoading: isLoadingSegment } = useSegmentDetail(
    config,
    campaign?.segment_id ?? '',
    { enabled: !!campaign?.segment_id }
  )

  const { data: segmentPreview } = useSegmentPreviewById(config, campaign?.segment_id ?? '', {
    enabled: !!campaign?.segment_id,
  })

  const { data: stats } = useCampaignStats(config, campaignId, {
    enabled: !!campaignId && !!token && !!campaign?.batch_id,
  })

  const { data: engagementTimeline } = useCampaignEngagementTimeline(config, campaignId, {
    enabled: !!campaignId && !!token && !!campaign?.batch_id,
  })

  const {
    data: broadcast,
    isLoading: isLoadingBroadcast,
    isError: isBroadcastError,
    apiError: broadcastApiError,
  } = useBroadcast(sendlyConfig, campaign?.batch_id ?? '', {
    enabled: !!campaign?.batch_id,
  })

  const { mutate: deleteCampaign } = useDeleteCampaign(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/campaigns')
    },
  })

  const { mutateAsync: sendCampaign } = useSendCampaign(config, {
    onSuccess: () => {
      sendModalRef.current?.close()
    },
  })

  const handleDelete = useCallback(() => {
    if (!campaign) return

    deleteModalRef.current?.open({
      title: 'Remove Campaign',
      description: `This will remove "${campaign.name}" from your campaigns. This action cannot be undone.`,
      onDelete: async () => {
        deleteModalRef.current?.updateConfig({ isLoading: true })
        deleteCampaign(campaignId)
      },
    })
  }, [campaign, campaignId, deleteCampaign])

  const handleSend = useCallback(() => {
    if (!campaign) return

    const contactCount = segmentPreview?.contact_count ?? 0

    sendModalRef.current?.open({
      title: 'Send Campaign?',
      description: `This will send "${campaign.name}" to ${contactCount} ${contactCount === 1 ? 'recipient' : 'recipients'} matching segment "${segment?.name}".`,
      onSend: async () => {
        sendModalRef.current?.updateConfig({ isLoading: true })
        await sendCampaign(campaignId)
      },
    })
  }, [campaign, campaignId, segment, segmentPreview, sendCampaign])

  if (isLoading || isLoadingTemplate || isLoadingSegment || isLoadingBroadcast) {
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

  const previewHtml = template
    ? template.layout?.html
      ? mergeTemplateIntoLayout(template.layout.html, template.html)
      : template.html
    : undefined

  const isDraft = campaign.status.toLowerCase() === 'draft'

  return (
    <div className="animate-slide-up h-full">
      <div className="flex lg:flex-row flex-col items-start gap-3">
        <div className="w-full lg:w-1/2 space-y-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold lg:text-3xl">Overview</h1>
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
                      disabled={!isDraft}
                      onClick={() => navigate(`/campaigns/${params.campaign_id}/edit`)}>
                      <Edit size={18} />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex w-full justify-start gap-2"
                      disabled={!isDraft}
                      onClick={handleSend}>
                      <Send size={18} />
                      <span>Send</span>
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
                  <dt className="d-label">ID</dt>
                  <dd className="d-content">
                    <ResourceID value={campaign.id} />
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Name</dt>
                  <dd className="d-content">{campaign.name || 'N/A'}</dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Status</dt>
                  <dd className="d-content">
                    <CampaignStatusBadge status={campaign.status} />
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Segment</dt>
                  <dd className="d-content">
                    {segment ? (
                      <Link to={`/segments/${segment.id}`} className="button-link">
                        {segment.name}
                      </Link>
                    ) : (
                      campaign.segment_id || 'N/A'
                    )}
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Recipients</dt>
                  <dd className="d-content">{segmentPreview?.contact_count ?? 'N/A'}</dd>
                </div>
                {campaign.project_id && (
                  <div className="d-item">
                    <dt className="d-label">Project ID</dt>
                    <dd className="d-content">{campaign.project_id || 'N/A'}</dd>
                  </div>
                )}
                <div className="d-item">
                  <dt className="d-label">Template</dt>
                  <dd className="d-content">
                    {!campaign.template_id
                      ? 'N/A'
                      : isLoadingTemplate
                        ? 'Loading...'
                        : isTemplateError
                          ? 'Unable to load (no access)'
                          : template?.name || campaign.template_id}
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">From Email</dt>
                  <dd className="d-content">{campaign.from_email || 'N/A'}</dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Subject</dt>
                  <dd className="d-content">{campaign.subject || 'N/A'}</dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Tags</dt>
                  <dd className="d-content">
                    {campaign.tags && campaign.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {campaign.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Sent At</dt>
                  <dd className="d-content">
                    {campaign?.sent_at ? <DateTime date={campaign.sent_at} /> : 'N/A'}
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Completed At</dt>
                  <dd className="d-content">
                    {campaign?.completed_at ? <DateTime date={campaign.completed_at} /> : 'N/A'}
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Created At</dt>
                  <dd className="d-content">
                    {campaign?.created_at ? <DateTime date={campaign.created_at} /> : 'N/A'}
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Updated At</dt>
                  <dd className="d-content">
                    {campaign?.updated_at ? <DateTime date={campaign.updated_at} /> : 'N/A'}
                  </dd>
                </div>
              </div>
            </CardContent>
          </Card>

          <Activity mode={campaign.batch_id ? 'visible' : 'hidden'}>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold lg:text-2xl">Broadcast</h2>
              </CardHeader>
              <CardContent>
                {isBroadcastError ? (
                  <ApiErrorOverlay
                    statusCode={broadcastApiError?.statusCode ?? 403}
                    message={broadcastApiError?.message ?? 'Access denied.'}
                    rawMessage={broadcastApiError?.rawMessage}
                  />
                ) : (
                  <div className="d-list">
                    <div className="d-item">
                      <dt className="d-label">Batch ID</dt>
                      <dd className="d-content">
                        {broadcast?.batch_id ? (
                          <a
                            href={buildResourceUrl(sendlyHostUrl!, '/broadcasts/:id/overview', {
                              id: broadcast.batch_id,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline">
                            {broadcast.batch_id.slice(0, 8)}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </dd>
                    </div>
                    <div className="d-item">
                      <dt className="d-label">Queued</dt>
                      <dd className="d-content">{broadcast?.queued_count ?? 'N/A'}</dd>
                    </div>
                    <div className="d-item">
                      <dt className="d-label">Suppressed</dt>
                      <dd className="d-content">{broadcast?.suppressed_count ?? 'N/A'}</dd>
                    </div>
                    <div className="d-item">
                      <dt className="d-label">Created At</dt>
                      <dd className="d-content">
                        {broadcast?.created_at ? <DateTime date={broadcast.created_at} /> : 'N/A'}
                      </dd>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Activity>

          <Activity mode={campaign.batch_id ? 'visible' : 'hidden'}>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold lg:text-2xl">Engagement</h2>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="d-list">
                  <div className="d-item">
                    <dt className="d-label">Delivery rate</dt>
                    <dd className="d-content">{formatRate(stats?.delivery_rate)}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Bounce rate</dt>
                    <dd className="d-content">{formatRate(stats?.bounce_rate)}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Open rate</dt>
                    <dd className="d-content">{formatRate(stats?.open_rate)}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Click rate</dt>
                    <dd className="d-content">{formatRate(stats?.click_rate)}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Click-to-open rate</dt>
                    <dd className="d-content">{formatRate(stats?.click_to_open_rate)}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Complaint rate</dt>
                    <dd className="d-content">{formatRate(stats?.complaint_rate)}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Recipients</dt>
                    <dd className="d-content">
                      {stats?.recipient_count ?? campaign.delivered_count}
                    </dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Delivered</dt>
                    <dd className="d-content">{campaign.delivered_count}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Opened</dt>
                    <dd className="d-content">{campaign.opened_count}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Clicked</dt>
                    <dd className="d-content">{campaign.clicked_count}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Bounced</dt>
                    <dd className="d-content">{campaign.bounced_count}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Complained</dt>
                    <dd className="d-content">{campaign.complained_count}</dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Data as of</dt>
                    <dd className="d-content">
                      {campaign.engagement_last_synced_at ? (
                        <DateTime date={campaign.engagement_last_synced_at} />
                      ) : (
                        <span className="text-muted-foreground">Not yet synced</span>
                      )}
                    </dd>
                  </div>
                  <div className="d-item">
                    <dt className="d-label">Engagement tracking ends</dt>
                    <dd className="d-content">
                      {campaign.engagement_polling_expires_at ? (
                        <DateTime date={campaign.engagement_polling_expires_at} />
                      ) : (
                        'N/A'
                      )}
                    </dd>
                  </div>
                </div>

                {stats && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Funnel</h3>
                    <CampaignFunnelChart stats={stats} />
                  </div>
                )}

                {engagementTimeline && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                      Engagement over time
                    </h3>
                    <CampaignEngagementTimelineChart timeline={engagementTimeline} />
                  </div>
                )}
              </CardContent>
            </Card>
          </Activity>
        </div>

        {(previewHtml || isTemplateError) && (
          <Card className="w-full lg:flex-1">
            <CardHeader>
              <h2 className="text-xl font-bold lg:text-2xl">Email</h2>
            </CardHeader>
            <CardContent>
              {isTemplateError ? (
                <ApiErrorOverlay
                  statusCode={templateApiError?.statusCode ?? 403}
                  message={templateApiError?.message ?? 'Access denied.'}
                  rawMessage={templateApiError?.rawMessage}
                />
              ) : (
                <iframe
                  ref={previewIframeRef}
                  srcDoc={previewHtml}
                  onLoad={handlePreviewLoad}
                  className="w-full border-0"
                  style={{ height: previewHeight ? `${previewHeight}px` : '600px' }}
                  sandbox="allow-same-origin"
                  title="Email Content"
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteConfirmation ref={deleteModalRef} />
      <SendConfirmation ref={sendModalRef} />
    </div>
  )
}
