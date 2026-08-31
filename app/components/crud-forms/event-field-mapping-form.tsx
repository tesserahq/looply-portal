import { Button } from '@/modules/shadcn/ui/button'
import {
  defaultEventFieldMappingFormValues,
  eventFieldMappingFormSchema,
  EventFieldMappingFormValue,
} from '@/resources/queries/event-field-mappings/event-field-mapping.schema'
import { CreateEventFieldMappingPayload } from '@/resources/queries/event-field-mappings'
import { useCustomFieldDefinitions } from '@/resources/hooks/custom-fields'
import { IQueryConfig } from '@/resources/queries'
import { useNavigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

interface EventFieldMappingFormProps {
  config: IQueryConfig
  onSubmit: (data: CreateEventFieldMappingPayload) => Promise<void> | void
}

export const EventFieldMappingForm = ({ config, onSubmit }: EventFieldMappingFormProps) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const { data: definitionsData, isLoading: isLoadingDefinitions } = useCustomFieldDefinitions(
    config,
    { page: 1, size: 100 }
  )

  const fieldOptions = useMemo(
    () =>
      (definitionsData?.items || []).map((definition) => ({
        value: definition.name,
        label: definition.label ? `${definition.label} (${definition.name})` : definition.name,
      })),
    [definitionsData]
  )

  const handleSubmit = async (data: EventFieldMappingFormValue) => {
    setIsSubmitting(true)

    try {
      await onSubmit(data)
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      schema={eventFieldMappingFormSchema}
      defaultValues={defaultEventFieldMappingFormValues}
      onSubmit={handleSubmit}>
      <FormLayout title="New Event Field Mapping">
        <Form.Input
          field="event_type"
          label="Event Type"
          placeholder="e.g. com.mylinden.person.created"
          description="Only takes effect once this event_type is also registered on the Tracked Event Types page."
          required
          autoFocus
        />

        <Form.Input
          field="source_path"
          label="Source Path"
          placeholder="e.g. account.family_member_count"
          description="Dot-path into the event's data. If it doesn't resolve for a given event, that event is still recorded - the mapping is just skipped."
          required
        />

        <Form.Select
          field="field_name"
          label="Target Custom Field"
          options={fieldOptions}
          isLoading={isLoadingDefinitions}
          description="The extracted value is validated against this field's locked type - a mismatch is skipped and logged, not rejected (there's no caller on the ingestion path to reject it back to)."
          required
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/event-field-mappings')}>
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
    </Form>
  )
}
