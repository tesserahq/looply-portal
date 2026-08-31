import { Button } from '@/modules/shadcn/ui/button'
import {
  defaultEventFieldMappingFormValues,
  eventFieldMappingFormSchema,
  EventFieldMappingFormValue,
} from '@/resources/queries/event-field-mappings/event-field-mapping.schema'
import {
  CONTACT_FIELD_TARGETS,
  CreateEventFieldMappingPayload,
  IDENTITY_KEY_TARGETS,
} from '@/resources/queries/event-field-mappings'
import { useCustomFieldDefinitions } from '@/resources/hooks/custom-fields'
import { IQueryConfig } from '@/resources/queries'
import { useNavigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

interface EventFieldMappingFormProps {
  config: IQueryConfig
  onSubmit: (data: CreateEventFieldMappingPayload) => Promise<void> | void
}

const TARGET_TYPE_OPTIONS = [
  { value: 'contact_field', label: 'Built-in Contact field' },
  { value: 'custom_field', label: 'Custom field' },
]

const CONTACT_FIELD_OPTIONS = CONTACT_FIELD_TARGETS.map((field) => ({
  value: field,
  label: field,
}))

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
      const payload: CreateEventFieldMappingPayload =
        data.target_type === 'contact_field'
          ? {
              event_type: data.event_type,
              source_path: data.source_path,
              target_type: 'contact_field',
              target_field: data.target_field,
              is_identity_key: data.is_identity_key,
            }
          : {
              event_type: data.event_type,
              source_path: data.source_path,
              target_type: 'custom_field',
              field_name: data.field_name,
              is_identity_key: false,
            }

      await onSubmit(payload)
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
      {(form) => {
        const targetType = form.watch('target_type')
        const targetField = form.watch('target_field')
        const canBeIdentityKey =
          targetType === 'contact_field' &&
          IDENTITY_KEY_TARGETS.includes(targetField as (typeof IDENTITY_KEY_TARGETS)[number])

        // Clear fields that only apply to the other target_type, and drop
        // is_identity_key once the target field can no longer carry it.
        useEffect(() => {
          if (targetType === 'contact_field') {
            form.setValue('field_name', '')
          } else {
            form.setValue('target_field', '')
            form.setValue('is_identity_key', false)
          }
        }, [targetType])

        useEffect(() => {
          if (!canBeIdentityKey) {
            form.setValue('is_identity_key', false)
          }
        }, [canBeIdentityKey])

        return (
          <FormLayout title="New Event Field Mapping">
            <Form.Input
              field="event_type"
              label="Event Type"
              placeholder="e.g. com.mylinden.person.updated"
              description="Only takes effect once this event_type is also registered on the Tracked Event Types page."
              required
              autoFocus
            />

            <Form.Input
              field="source_path"
              label="Source Path"
              placeholder="e.g. person.account.family_member_count"
              description="Dot-path into the event's data. If it doesn't resolve for a given event, that event is still recorded - the mapping is just skipped (or, for an identity-key mapping, the whole event is dropped)."
              required
            />

            <Form.Select
              field="target_type"
              label="Target"
              options={TARGET_TYPE_OPTIONS}
              description="Whether the extracted value fills in a built-in Contact field or a custom field."
              required
            />

            {targetType === 'contact_field' ? (
              <>
                <Form.Select
                  field="target_field"
                  label="Target Contact Field"
                  options={CONTACT_FIELD_OPTIONS}
                  description="The built-in Contact column to write the extracted value to."
                  required
                />

                <Form.Switch
                  field="is_identity_key"
                  label="Identity Key"
                  description="Use this mapping's resolved value to look up/create the Contact for this event_type, instead of just filling in an attribute. Only one mapping per event_type may be the identity key, and it must target External ID or Email."
                  disabled={!canBeIdentityKey}
                />
              </>
            ) : (
              <Form.Select
                field="field_name"
                label="Target Custom Field"
                options={fieldOptions}
                isLoading={isLoadingDefinitions}
                description="The extracted value is validated against this field's locked type - a mismatch is skipped and logged, not rejected (there's no caller on the ingestion path to reject it back to)."
                required
              />
            )}

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
        )
      }}
    </Form>
  )
}
