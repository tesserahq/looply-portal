import {
  CampaignPreviewDialog,
  SAMPLE_RECIPIENT_VARIABLES,
} from '@/components/campaign-preview/campaign-preview-dialog'
import {
  RichEmailEditor,
  type RichEmailEditorRef,
} from '@/components/email-editor/rich-email-editor'
import { LayoutSelect } from '@/components/form/layout-select'
import { SegmentSelect, type SegmentOption } from '@/components/form/form-segments'
import { JsonEditor, type JsonObject } from '@/components/json/editor'
import { NodeENVType } from '@/libraries/fetch'
import { useCreateCampaign, useUpdateCampaign } from '@/resources/hooks/campaigns'
import { useRenderContent } from '@/resources/hooks/render'
import { useSegmentPreviewById } from '@/resources/hooks/segments'
import { useUploadAsset } from '@/resources/hooks/vaulta'
import { getAssetServeUrl } from '@/resources/queries/vaulta'
import { CampaignType } from '@/resources/queries/campaigns/campaign.type'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Input } from '@shadcn/ui/input'
import { Label } from '@shadcn/ui/label'
import { Eye, Users } from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useApp } from 'tessera-ui'
import { TagsInput } from 'tessera-ui/components'

const SIX_MONTHS_IN_SECONDS = 60 * 60 * 24 * 30 * 6

export interface CampaignFormInitialValues {
  name: string
  segmentId?: string
  subject: string
  fromEmail: string
  html?: string | null
  layoutId?: string | null
  templateVariables?: JsonObject
  tags?: string[]
}

export interface CampaignFormProps {
  mode: 'create' | 'edit'
  apiUrl: string
  sendlyApiUrl: string
  vaultaApiUrl: string
  nodeEnv: NodeENVType
  campaignId?: string
  initialValues?: CampaignFormInitialValues
  footer?: React.ReactNode
  disabled?: boolean
}

export interface CampaignFormRef {
  save: (options?: { silent?: boolean }) => Promise<CampaignType>
}

export const CampaignForm = forwardRef<CampaignFormRef, CampaignFormProps>(function CampaignForm(
  {
    mode,
    apiUrl,
    sendlyApiUrl,
    vaultaApiUrl,
    nodeEnv,
    campaignId,
    initialValues,
    footer,
    disabled = false,
  },
  ref
) {
  const { token } = useApp()
  const richEditorRef = useRef<RichEmailEditorRef>(null)
  const [editorReady, setEditorReady] = useState(false)

  const config = { apiUrl, token: token!, nodeEnv }
  const sendlyConfig = { apiUrl: sendlyApiUrl, token: token!, nodeEnv }
  const vaultaConfig = { apiUrl: vaultaApiUrl, token: token!, nodeEnv }

  const [name, setName] = useState(initialValues?.name ?? '')
  const [segmentId, setSegmentId] = useState<string | undefined>(initialValues?.segmentId)
  const [segmentError, setSegmentError] = useState<string>()
  const [subject, setSubject] = useState(initialValues?.subject ?? '')
  const [fromEmail, setFromEmail] = useState(initialValues?.fromEmail ?? '')
  const [layoutId, setLayoutId] = useState<string | undefined>(initialValues?.layoutId ?? undefined)
  const [templateVariables, setTemplateVariables] = useState<JsonObject>(
    initialValues?.templateVariables ?? {}
  )
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? [])

  const handleSegmentChange = (segment?: SegmentOption) => {
    setSegmentId(segment?.id)
    if (segment?.id) setSegmentError(undefined)
  }

  // A segment doesn't carry a static contact count like a contact list did -
  // it's resolved live, so the recipient count shown in the footer comes
  // from the same preview endpoint the Segments UI uses.
  const { data: segmentPreview } = useSegmentPreviewById(config, segmentId ?? '', {
    enabled: !!segmentId,
  })

  // Seed the editor once it's ready (it becomes ready asynchronously -
  // immediatelyRender: false - so seeding has to wait on `editorReady`
  // rather than run on mount).
  const hasSeededEditor = useRef(false)
  useEffect(() => {
    if (!editorReady || hasSeededEditor.current) return
    hasSeededEditor.current = true
    if (initialValues?.html) richEditorRef.current?.setContent(initialValues.html)
  }, [editorReady, initialValues?.html])

  const { mutateAsync: createCampaign } = useCreateCampaign(config)
  const { mutateAsync: updateCampaign } = useUpdateCampaign(config)
  const { mutateAsync: uploadAsset } = useUploadAsset(vaultaConfig)

  const [previewOpen, setPreviewOpen] = useState(false)
  const {
    mutate: renderPreview,
    data: previewResult,
    isPending: isRenderingPreview,
    apiError: previewError,
    reset: resetPreview,
  } = useRenderContent(sendlyConfig)

  // On demand, never per keystroke: renders the editor's current content
  // through Sendly, the same path a real send takes.
  const handlePreview = async () => {
    resetPreview()
    setPreviewOpen(true)
    let html: string
    try {
      html = (await richEditorRef.current?.getHTML()) ?? ''
    } catch (error) {
      console.error('Failed to serialize email body', error)
      html = ''
    }
    renderPreview({
      html,
      subject,
      layout_id: layoutId,
      template_variables: { ...templateVariables, ...SAMPLE_RECIPIENT_VARIABLES },
    })
  }

  const handleUploadImage = async (file: File) => {
    const asset = await uploadAsset({ file, expires_in: SIX_MONTHS_IN_SECONDS })
    if (!asset) throw new Error('Upload failed')
    return { url: getAssetServeUrl(vaultaApiUrl, asset) }
  }

  useImperativeHandle(
    ref,
    () => ({
      save: async (options) => {
        const showSuccessToast = !options?.silent

        if (!segmentId) {
          setSegmentError('Segment is required')
          throw new Error('Segment is required')
        }
        setSegmentError(undefined)

        // Serializing the editor's content can throw (a known failure mode of
        // the underlying HTML formatter on certain table structures). Don't
        // let that block saving the rest of the campaign's fields — surface
        // it and leave the stored body untouched.
        let html: string | undefined
        try {
          html = (await richEditorRef.current?.getHTML()) ?? ''
        } catch (error) {
          console.error('Failed to serialize email body', error)
        }

        const content = {
          name,
          segment_id: segmentId,
          subject,
          from_email: fromEmail,
          layout_id: layoutId,
          template_variables: templateVariables,
          tags,
          ...(html !== undefined && { html }),
        }

        if (mode === 'create') {
          return createCampaign(content)
        }

        return updateCampaign({
          id: campaignId!,
          updateData: content,
          showSuccessToast,
        })
      },
    }),
    [
      mode,
      name,
      segmentId,
      subject,
      fromEmail,
      layoutId,
      templateVariables,
      tags,
      campaignId,
      createCampaign,
      updateCampaign,
    ]
  )

  return (
    <Card className="mb-5 animate-slide-up">
      <CardHeader>
        <CardTitle>Campaign details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <Label className='after:text-destructive after:ml-0.5 after:content-["*"]'>
              Segment
            </Label>
            <SegmentSelect
              value={segmentId}
              onChange={handleSegmentChange}
              apiUrl={apiUrl}
              nodeEnv={nodeEnv}
              disabled={disabled}
            />
            {segmentError && (
              <p className="text-destructive mt-1 text-sm font-medium">{segmentError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <Label htmlFor="from-email">From Email</Label>
            <Input
              id="from-email"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <Label className='after:text-destructive after:ml-0.5 after:content-["*"]'>
              Layout
            </Label>
            <LayoutSelect
              value={layoutId}
              onChange={setLayoutId}
              sendlyApiUrl={sendlyApiUrl}
              nodeEnv={nodeEnv}
              disabled={disabled}
            />
            {!layoutId && !disabled && (
              <p className="text-muted-foreground mt-1 text-sm">
                A layout is required before this campaign can be sent.
              </p>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Body</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={!editorReady}>
              <Eye size={16} />
              Preview
            </Button>
          </div>
          <div className="mt-1.5 overflow-hidden rounded-md border">
            <RichEmailEditor
              ref={richEditorRef}
              height="450px"
              onReady={() => setEditorReady(true)}
              onUploadImage={handleUploadImage}
              editable={!disabled}
            />
          </div>
        </div>
        <div>
          <Label>Template Variables</Label>
          <div className="mt-1.5">
            <JsonEditor
              initialValue={templateVariables}
              onChange={setTemplateVariables}
              readOnly={disabled}
            />
          </div>
        </div>
        <div>
          <Label>Tags</Label>
          <div className="mt-1.5">
            <TagsInput value={tags} onChange={setTags} disabled={disabled} />
          </div>
        </div>

        <CampaignPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          isLoading={isRenderingPreview}
          result={previewResult}
          error={previewError}
        />

        {footer && (
          <div className="flex items-center justify-between gap-2 pt-2">
            {segmentId && (
              <div className="flex items-center gap-2">
                <Users size={16} />
                <p>
                  This campaign will reach <b>{segmentPreview?.contact_count ?? 0}</b>{' '}
                  {segmentPreview?.contact_count === 1 ? 'recipient' : 'recipients'}
                </p>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">{footer}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
