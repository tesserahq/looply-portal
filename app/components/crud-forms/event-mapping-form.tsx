import { Button } from '@/modules/shadcn/ui/button'
import {
  defaultEventMappingFormValues,
  eventMappingFormSchema,
  EventMappingFormValue,
} from '@/resources/queries/event-mappings/event-mapping.schema'
import { CreateEventMappingPayload, IDENTITY_KEY_TARGETS } from '@/resources/queries/event-mappings'
import { useContactStatuses } from '@/resources/hooks/contacts'
import { NodeENVType } from '@/libraries/fetch'
import { useNavigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from 'tessera-ui'
import { TagsInput } from 'tessera-ui/components'
import { Label } from '@shadcn/ui/label'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

interface EventMappingFormProps {
  onSubmit: (data: CreateEventMappingPayload) => Promise<void> | void
  apiUrl: string
  nodeEnv: NodeENVType
}

const IDENTITY_TARGET_OPTIONS = IDENTITY_KEY_TARGETS.map((field) => ({
  value: field,
  label: field,
}))

export const EventMappingForm = ({ onSubmit, apiUrl, nodeEnv }: EventMappingFormProps) => {
  const navigate = useNavigate()
  const { token } = useApp()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [defaultTags, setDefaultTags] = useState<string[]>([])

  const { data: contactStatusesData, isLoading: isLoadingContactStatuses } = useContactStatuses({
    apiUrl,
    token: token!,
    nodeEnv,
  })
  const contactStatusOptions = useMemo(
    () =>
      (contactStatusesData?.items || []).map((option) => ({
        value: option.id,
        label: option.name,
      })),
    [contactStatusesData]
  )

  const handleSubmit = async (data: EventMappingFormValue) => {
    setIsSubmitting(true)

    try {
      await onSubmit({
        event_type: data.event_type,
        source: data.source || undefined,
        identity_target_field: data.identity_target_field || undefined,
        identity_source_path: data.identity_source_path || undefined,
        default_status: data.default_status || undefined,
        default_tags: defaultTags.length > 0 ? defaultTags : undefined,
      })
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      schema={eventMappingFormSchema}
      defaultValues={defaultEventMappingFormValues}
      onSubmit={handleSubmit}>
      {() => {
        return (
          <FormLayout title="Register New Event Mapping">
            <Form.Input
              field="event_type"
              label="Event Type"
              placeholder="e.g. com.mylinden.person.created"
              description="The exact event_type Looply should start acting on. Everything else received on the shared NATS stream is ignored - no contact resolution, no event recorded, no field mapping applied."
              required
              autoFocus
            />

            <Form.Input
              field="source"
              label="Source"
              placeholder="e.g. linden"
              description="Stamped onto every contact auto-created from this event_type (like 'manual', 'website', or 'phone' are for other creation paths). Optional - leave blank to leave newly auto-created contacts' source unset."
            />

            <Form.Select
              field="identity_target_field"
              label="Identity Field"
              placeholder="None yet - configure later"
              options={IDENTITY_TARGET_OPTIONS}
              description="Which Contact column identifies the contact for this event_type. Without one, every event for this event_type is dropped until you set it (here or later)."
            />

            <Form.Input
              field="identity_source_path"
              label="Identity Source Path"
              placeholder="e.g. person.id"
              description="Dot-path into the event's data resolved to find/create the Contact. Required together with Identity Field, or leave both blank."
            />

            <Form.Select
              field="default_status"
              label="Default Status"
              placeholder="Leave unset"
              isLoading={isLoadingContactStatuses}
              options={contactStatusOptions}
              description="Stamped onto a contact auto-created from this event_type. Only applies on creation - never changes an existing contact matched by a later event."
            />

            <div>
              <Label>Default Tags</Label>
              <div className="mt-1.5">
                <TagsInput value={defaultTags} onChange={setDefaultTags} disabled={isSubmitting} />
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">
                Stamped onto a contact auto-created from this event_type. Only applies on creation -
                never changes an existing contact matched by a later event.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => navigate('/event-mappings')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </FormLayout>
        )
      }}
    </Form>
  )
}
