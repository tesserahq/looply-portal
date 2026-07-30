import { CampaignForm, type CampaignFormRef } from '@/components/form/campaign-form'
import { AppPreloader } from '@/components/loader/pre-loader'
import SendConfirmation from '@/components/send-confirmation/send-confirmation'
import { CampaignStatusBadge } from '@/components/campaign-status/campaign-status'
import { useApp } from 'tessera-ui'
import { useCampaignDetail, useSendCampaign } from '@/resources/hooks/campaigns'
import { Button } from '@shadcn/ui/button'
import { useRef, useState } from 'react'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const sendlyApiUrl = process.env.SENDLY_API_URL
  const vaultaApiUrl = process.env.VAULTA_API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, sendlyApiUrl, vaultaApiUrl, nodeEnv }
}

export default function CampaignEdit() {
  const { apiUrl, sendlyApiUrl, vaultaApiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { campaign_id } = useParams<{ campaign_id: string }>()
  const sendModalRef = useRef<React.ComponentRef<typeof SendConfirmation>>(null)
  const formRef = useRef<CampaignFormRef>(null)
  const [isSaving, setIsSaving] = useState(false)

  const config = { apiUrl: apiUrl!, nodeEnv, token: token! }

  const { data: campaign, isLoading } = useCampaignDetail(config, campaign_id!)

  const { mutateAsync: sendCampaign } = useSendCampaign(config, {
    onSuccess: () => {
      sendModalRef.current?.close()
      navigate(`/campaigns/${campaign_id}`)
    },
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await formRef.current?.save()
    } catch {
      // Validation/serialization errors are already surfaced to the user
      // (toast) inside CampaignForm.save() — nothing further to do here.
    } finally {
      setIsSaving(false)
    }
  }

  const handleSend = () => {
    if (!campaign) return

    sendModalRef.current?.open({
      title: 'Send Campaign?',
      description: `This will send "${campaign.name}" to its contact list.`,
      onSend: async () => {
        sendModalRef.current?.updateConfig({ isLoading: true })
        try {
          await formRef.current?.save({ silent: true })
          await sendCampaign(campaign_id!)
        } catch {
          sendModalRef.current?.updateConfig({ isLoading: false })
        }
      },
    })
  }

  if (isLoading || !campaign) {
    return <AppPreloader />
  }

  const isDraft = campaign.status.toLowerCase() === 'draft'

  return (
    <div className="page-content h-full">
      <div className="mb-5 flex items-center gap-3 animate-slide-up">
        <h1 className="page-title">Edit campaign</h1>
        <CampaignStatusBadge status={campaign.status} />
      </div>

      <CampaignForm
        ref={formRef}
        mode="edit"
        campaignId={campaign_id!}
        templateId={campaign.template_id}
        initialValues={{
          name: campaign.name,
          contactListId: campaign.contact_list_id || undefined,
          subject: campaign.subject,
          fromEmail: campaign.from_email,
        }}
        apiUrl={apiUrl!}
        sendlyApiUrl={sendlyApiUrl!}
        vaultaApiUrl={vaultaApiUrl!}
        nodeEnv={nodeEnv}
        disabled={!isDraft}
        footer={
          <>
            <Button variant="outline" onClick={handleSave} disabled={isSaving || !isDraft}>
              {isSaving ? 'Saving...' : 'Save draft'}
            </Button>
            <Button onClick={handleSend} disabled={!isDraft}>
              Send
            </Button>
          </>
        }
      />

      <SendConfirmation ref={sendModalRef} />
    </div>
  )
}
