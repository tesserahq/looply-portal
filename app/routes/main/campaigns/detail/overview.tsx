import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import SendConfirmation from '@/components/send-confirmation/send-confirmation'
import { CampaignStatusBadge } from '@/components/campaign-status/campaign-status'
import { JsonEditor } from '@/components/json/editor'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { useApp } from 'tessera-ui'
import { DateTime, ResourceID } from 'tessera-ui/components'
import { useCampaignDetail, useDeleteCampaign, useSendCampaign } from '@/resources/hooks/campaigns'
import { useContactListDetail } from '@/resources/hooks/contact-lists'
import { useTemplate } from '@/resources/hooks/templates'
import { mergeTemplateIntoLayout } from '@/utils/helpers/layout.helper'
import { useLoaderData, useNavigate, useParams } from 'react-router'
import { Edit, EllipsisVertical, Send, Trash2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const sendlyApiUrl = process.env.SENDLY_API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, sendlyApiUrl, nodeEnv }
}

export default function CampaignDetail() {
  const { apiUrl, sendlyApiUrl, nodeEnv } = useLoaderData<typeof loader>()
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

  const { data: template, isLoading: isLoadingTemplate } = useTemplate(
    sendlyConfig,
    campaign?.template_id ?? '',
    { enabled: !!campaign?.template_id }
  )

  const { data: contactList, isLoading: isLoadingContactList } = useContactListDetail(
    config,
    campaign?.contact_list_id ?? '',
    { enabled: !!campaign?.contact_list_id }
  )

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

    const contactCount = contactList?.contact_count ?? 0

    sendModalRef.current?.open({
      title: 'Send Campaign?',
      description: `This will send "${campaign.name}" to ${contactCount} ${contactCount === 1 ? 'recipient' : 'recipients'} in "${contactList?.name}".`,
      onSend: async () => {
        sendModalRef.current?.updateConfig({ isLoading: true })
        await sendCampaign(campaignId)
      },
    })
  }, [campaign, campaignId, contactList, sendCampaign])

  if (isLoading || isLoadingTemplate || isLoadingContactList) {
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
      <div className="flex md:flex-row flex-col items-start gap-3">
        <div className="w-full md:w-1/2 space-y-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold lg:text-3xl">Campaign Details</h1>
                  <CampaignStatusBadge status={campaign.status} className="shadow-sm" />
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
                  <dt className="d-label">Contact List</dt>
                  <dd className="d-content">
                    {contactList?.name || campaign.contact_list_id || 'N/A'}
                  </dd>
                </div>
                <div className="d-item">
                  <dt className="d-label">Recipients</dt>
                  <dd className="d-content">{contactList?.contact_count ?? 'N/A'}</dd>
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
                  <dt className="d-label">Batch ID</dt>
                  <dd className="d-content">{campaign.batch_id || 'N/A'}</dd>
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
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold lg:text-2xl">Template Variables</h2>
            </CardHeader>
            <CardContent className="h-full">
              <JsonEditor initialValue={campaign.template_variables ?? {}} readOnly />
            </CardContent>
          </Card>
        </div>

        {previewHtml && (
          <Card className="flex-1">
            <CardHeader>
              <h2 className="text-xl font-bold lg:text-2xl">Email</h2>
            </CardHeader>
            <CardContent>
              <iframe
                ref={previewIframeRef}
                srcDoc={previewHtml}
                onLoad={handlePreviewLoad}
                className="w-full border-0"
                style={{ height: previewHeight ? `${previewHeight}px` : '600px' }}
                sandbox="allow-same-origin"
                title="Email Content"
              />
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteConfirmation ref={deleteModalRef} />
      <SendConfirmation ref={sendModalRef} />
    </div>
  )
}
