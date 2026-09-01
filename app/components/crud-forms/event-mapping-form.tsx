import { Button } from '@/modules/shadcn/ui/button'
import {
  defaultEventMappingFormValues,
  eventMappingFormSchema,
  EventMappingFormValue,
} from '@/resources/queries/event-mappings/event-mapping.schema'
import { CreateEventMappingPayload, IDENTITY_KEY_TARGETS } from '@/resources/queries/event-mappings'
import { useNavigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

interface EventMappingFormProps {
  onSubmit: (data: CreateEventMappingPayload) => Promise<void> | void
}

const IDENTITY_TARGET_OPTIONS = [
  { value: '', label: 'None yet - configure later' },
  ...IDENTITY_KEY_TARGETS.map((field) => ({ value: field, label: field })),
]

export const EventMappingForm = ({ onSubmit }: EventMappingFormProps) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = async (data: EventMappingFormValue) => {
    setIsSubmitting(true)

    try {
      await onSubmit({
        event_type: data.event_type,
        source: data.source || undefined,
        identity_target_field: data.identity_target_field || undefined,
        identity_source_path: data.identity_source_path || undefined,
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
              options={IDENTITY_TARGET_OPTIONS}
              description="Which Contact column identifies the contact for this event_type. Without one, every event for this event_type is dropped until you set it (here or later)."
            />

            <Form.Input
              field="identity_source_path"
              label="Identity Source Path"
              placeholder="e.g. person.id"
              description="Dot-path into the event's data resolved to find/create the Contact. Required together with Identity Field, or leave both blank."
            />

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
