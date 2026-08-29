import {
  RichEmailEditor,
  type RichEmailEditorRef,
} from '@/components/email-editor/rich-email-editor'
import { ContactListSelect, type ContactListOption } from '@/components/form/form-contact-lists'
import { JsonEditor, type JsonObject } from '@/components/json/editor'
import { ApiErrorOverlay } from '@/components/misc/api-error-overlay'
import { AppPreloader } from '@/components/loader/pre-loader'
import { TagsInput } from '@/components/tags-input/tags-input'
import { NodeENVType } from '@/libraries/fetch'
import { useCreateCampaign, useUpdateCampaign } from '@/resources/hooks/campaigns'
import {
  useCloneTemplate,
  useCreateTemplate,
  useTemplate,
  useUpdateTemplate,
} from '@/resources/hooks/templates'
import { useUploadAsset } from '@/resources/hooks/vaulta'
import { CampaignType } from '@/resources/queries/campaigns/campaign.type'
import { generateRandomString, generateTemplateAlias } from '@/utils/helpers/slug.helper'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Input } from '@shadcn/ui/input'
import { Label } from '@shadcn/ui/label'
import { Users } from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useApp } from 'tessera-ui'

const SIX_MONTHS_IN_SECONDS = 60 * 60 * 24 * 30 * 6

export interface CampaignFormInitialValues {
  name: string
  contactListId?: string
  subject: string
  fromEmail: string
  templateVariables?: JsonObject
  tags?: string[]
}

export interface CampaignFormProps {
  mode: 'create' | 'edit'
  apiUrl: string
  sendlyApiUrl: string
  vaultaApiUrl: string
  nodeEnv: NodeENVType
  templateId: string
  campaignId?: string
  initialValues?: CampaignFormInitialValues
  footer?: React.ReactNode
  disabled?: boolean
  /** Clone `templateId` into a campaign-specific copy on save — only when the
   * user started this campaign from an existing template, as opposed to a
   * blank template created for a brand-new campaign. */
  cloneTemplateOnSave?: boolean
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
    templateId,
    campaignId,
    initialValues,
    footer,
    disabled = false,
    cloneTemplateOnSave = false,
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
  const [contactListId, setContactListId] = useState<string | undefined>(
    initialValues?.contactListId
  )
  const [contactCount, setContactCount] = useState(0)
  const [contactListError, setContactListError] = useState<string>()
  const [subject, setSubject] = useState(initialValues?.subject ?? '')
  const [fromEmail, setFromEmail] = useState(initialValues?.fromEmail ?? '')
  const [templateVariables, setTemplateVariables] = useState<JsonObject>(
    initialValues?.templateVariables ?? {}
  )
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? [])
  const [currentTemplateId, setCurrentTemplateId] = useState(templateId)

  const {
    data: template,
    isError: isTemplateError,
    apiError: templateApiError,
    isLoading: isLoadingTemplate,
  } = useTemplate(sendlyConfig, currentTemplateId, { enabled: !!currentTemplateId })

  const handleContactListChange = (contactList?: ContactListOption) => {
    setContactListId(contactList?.id)
    setContactCount(contactList?.contactCount ?? 0)
    if (contactList?.id) setContactListError(undefined)
  }

  // Seeding the editor is separate from `template` because the editor becomes
  // ready asynchronously (immediatelyRender: false) — if `template` had already
  // resolved before the editor mounted, a single effect keyed only on `template`
  // would silently no-op against a still-null editor.
  useEffect(() => {
    if (template && editorReady) {
      richEditorRef.current?.setContent(template.html)
    }
  }, [template, editorReady])

  const hasPrefilledFromTemplate = useRef(false)
  useEffect(() => {
    if (mode === 'create' && template && !hasPrefilledFromTemplate.current) {
      hasPrefilledFromTemplate.current = true
      setSubject((prev) => prev || template.subject || '')
      setFromEmail((prev) => prev || template.from_email || '')
    }
  }, [mode, template])

  const { mutateAsync: createCampaign } = useCreateCampaign(config)
  const { mutateAsync: updateCampaign } = useUpdateCampaign(config)
  const { mutateAsync: createTemplate } = useCreateTemplate(sendlyConfig)
  const { mutateAsync: updateTemplate } = useUpdateTemplate(sendlyConfig)
  const { mutateAsync: uploadAsset } = useUploadAsset(vaultaConfig)
  const { mutateAsync: cloneTemplate } = useCloneTemplate(sendlyConfig)

  const handleUploadImage = async (file: File) => {
    const asset = await uploadAsset({ file, expires_in: SIX_MONTHS_IN_SECONDS })
    if (!asset) throw new Error('Upload failed')
    return { url: asset.url }
  }

  useImperativeHandle(
    ref,
    () => ({
      save: async (options) => {
        const showSuccessToast = !options?.silent

        if (!contactListId) {
          setContactListError('Contact list is required')
          throw new Error('Contact list is required')
        }
        setContactListError(undefined)

        // Serializing the editor's content can throw (a known failure mode of
        // the underlying HTML formatter on certain table structures). Don't
        // let that block saving the rest of the campaign's fields — surface
        // it and skip only the template/body update.
        let html: string | undefined
        try {
          html = (await richEditorRef.current?.getHTML()) ?? ''
        } catch (error) {
          console.error('Failed to serialize email body', error)
        }

        // Only sync the campaign name into the template when the template
        // doesn't already have one of its own (e.g. a blank template created
        // via the "New" flow) — an existing, named template shouldn't get
        // renamed just because it's attached to this campaign.
        const syncTemplateName = !template?.name

        if (mode === 'create') {
          const campaign = await createCampaign({
            name,
            contact_list_id: contactListId ?? '',
            template_id: currentTemplateId,
            subject,
            from_email: fromEmail,
            template_variables: templateVariables,
            tags,
          })
          if (html !== undefined) {
            await updateTemplate({
              id: currentTemplateId,
              updateData: {
                subject,
                from_email: fromEmail,
                html,
                ...(syncTemplateName && { name }),
              },
            })
          }

          // Clone the source template into a campaign-specific copy so edits
          // made here don't mutate the template the user picked. Only
          // applies when starting from an existing template — a blank
          // template created for a brand-new campaign has nothing worth
          // preserving under its own name.
          if (cloneTemplateOnSave) {
            const randomSuffix = generateRandomString(5)
            await cloneTemplate({
              id: currentTemplateId,
              data: {
                name: `Campaign: ${name}-${randomSuffix}`,
                tags: ['broadcast', `campaign:${campaign.id.substring(0, 8)}`],
                alias: `campaign-${template?.alias}-${randomSuffix}`,
              },
            })
          }

          return campaign
        }

        const campaign = await updateCampaign({
          id: campaignId!,
          updateData: {
            name,
            contact_list_id: contactListId,
            subject,
            from_email: fromEmail,
            template_variables: templateVariables,
            tags,
          },
          showSuccessToast,
        })

        if (html !== undefined) {
          if (!currentTemplateId) {
            const created = await createTemplate({
              alias: generateTemplateAlias(name),
              name,
              subject: '',
              html,
            })
            setCurrentTemplateId(created.id)
            await updateCampaign({
              id: campaignId!,
              updateData: { template_id: created.id },
              showSuccessToast: false,
            })
          } else {
            await updateTemplate({
              id: currentTemplateId,
              updateData: {
                subject,
                from_email: fromEmail,
                html,
                ...(syncTemplateName && { name }),
              },
            })
          }
        }

        return campaign
      },
    }),
    [
      mode,
      name,
      contactListId,
      subject,
      fromEmail,
      templateVariables,
      tags,
      currentTemplateId,
      campaignId,
      template,
      cloneTemplateOnSave,
      createCampaign,
      updateCampaign,
      createTemplate,
      updateTemplate,
      cloneTemplate,
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
              Contact list
            </Label>
            <ContactListSelect
              value={contactListId}
              onChange={handleContactListChange}
              apiUrl={apiUrl}
              nodeEnv={nodeEnv}
              disabled={disabled}
            />
            {contactListError && (
              <p className="text-destructive mt-1 text-sm font-medium">{contactListError}</p>
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
        </div>
        <div>
          <Label>Body</Label>
          <div className="mt-1.5 overflow-hidden rounded-md border">
            {isLoadingTemplate ? (
              <AppPreloader className="h-[450px]" />
            ) : isTemplateError ? (
              <ApiErrorOverlay
                statusCode={templateApiError?.statusCode ?? 403}
                message={templateApiError?.message ?? 'Access denied.'}
                rawMessage={templateApiError?.rawMessage}
              />
            ) : (
              <RichEmailEditor
                ref={richEditorRef}
                height="450px"
                onReady={() => setEditorReady(true)}
                onUploadImage={handleUploadImage}
                editable={!disabled}
              />
            )}
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

        {footer && (
          <div className="flex items-center justify-between gap-2 pt-2">
            {contactCount !== null && (
              <div className="flex items-center gap-2">
                <Users size={16} />
                <p>
                  This campaign will reach <b>{contactCount}</b>{' '}
                  {contactCount === 1 ? 'recipient' : 'recipients'}
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
