import { CampaignForm, type CampaignFormRef } from '@/components/form/campaign-form'
import { NewCampaignModal } from '@/components/dialog/new-campaign-modal'
import { Button } from '@shadcn/ui/button'
import { Loader2, Save } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const sendlyApiUrl = process.env.SENDLY_API_URL
  const vaultaApiUrl = process.env.VAULTA_API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, sendlyApiUrl, vaultaApiUrl, nodeEnv }
}

export default function CampaignNew() {
  const { apiUrl, sendlyApiUrl, vaultaApiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('template_id')
  const isFromExistingTemplate = searchParams.get('source') === 'template'

  const formRef = useRef<CampaignFormRef>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!templateId) {
    return (
      <NewCampaignModal
        open
        onOpenChange={(open) => {
          if (!open) navigate('/campaigns')
        }}
        apiUrl={apiUrl!}
        sendlyApiUrl={sendlyApiUrl!}
        nodeEnv={nodeEnv}
      />
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const campaign = await formRef.current?.save()
      if (campaign) navigate(`/campaigns/${campaign.id}`)
    } catch {
      // Validation/serialization errors are already surfaced to the user
      // (toast) inside CampaignForm.save() — nothing further to do here.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-content h-full">
      <div className="mb-5">
        <h1 className="page-title">New campaign</h1>
      </div>

      <CampaignForm
        ref={formRef}
        mode="create"
        templateId={templateId}
        cloneTemplateOnSave={isFromExistingTemplate}
        apiUrl={apiUrl!}
        sendlyApiUrl={sendlyApiUrl!}
        vaultaApiUrl={vaultaApiUrl!}
        nodeEnv={nodeEnv}
        footer={
          <>
            <Button variant="outline" onClick={() => navigate('/campaigns')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      />
    </div>
  )
}
