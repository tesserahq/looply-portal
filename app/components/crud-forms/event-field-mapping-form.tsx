import { Button } from '@/modules/shadcn/ui/button'
import {
  defaultEventFieldMappingFormValues,
  eventFieldMappingFormSchema,
  EventFieldMappingFormValue,
} from '@/resources/queries/event-field-mappings/event-field-mapping.schema'
import { CONTACT_FIELD_TARGETS } from '@/resources/queries/event-field-mappings'
import { useCustomFieldDefinitions } from '@/resources/hooks/custom-fields'
import { IQueryConfig } from '@/resources/queries'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

interface EventFieldMappingFormProps {
  config: IQueryConfig
  title?: string
  defaultValues?: EventFieldMappingFormValue
  onSubmit: (data: EventFieldMappingFormValue) => Promise<void> | void
  onCancel: () => void
}

const TARGET_TYPE_OPTIONS = [
  { value: 'contact_field', label: 'Built-in Contact field' },
  { value: 'custom_field', label: 'Custom field' },
]

const CONTACT_FIELD_OPTIONS = CONTACT_FIELD_TARGETS.map((field) => ({
  value: field,
  label: field,
}))

export const EventFieldMappingForm = ({
  config,
  title = 'New Field Mapping',
  defaultValues = defaultEventFieldMappingFormValues,
  onSubmit,
  onCancel,
}: EventFieldMappingFormProps) => {
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
      defaultValues={defaultValues}
      onSubmit={handleSubmit}>
      {(form) => {
        const targetType = form.watch('target_type')

        // Clear the field that only applies to the other target_type whenever
        // it changes, so a stale value from the previous target_type can't be
        // submitted alongside the new one.
        useEffect(() => {
          if (targetType === 'contact_field') {
            form.setValue('field_name', '')
          } else {
            form.setValue('target_field', '')
          }
        }, [targetType])

        return (
          <FormLayout title={title}>
            <Form.Input
              field="source_path"
              label="Source Path"
              placeholder="e.g. person.account.family_member_count"
              description="Dot-path into the event's data. If it doesn't resolve for a given event, that event is still recorded - this mapping is just skipped."
              required
              autoFocus
            />

            <Form.Select
              field="target_type"
              label="Target"
              options={TARGET_TYPE_OPTIONS}
              description="Whether the extracted value fills in a built-in Contact field or a custom field."
              required
            />

            {targetType === 'contact_field' ? (
              <Form.Select
                field="target_field"
                label="Target Contact Field"
                options={CONTACT_FIELD_OPTIONS}
                description="The built-in Contact column to write the extracted value to."
                required
              />
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
              <Button variant="secondary" type="button" onClick={onCancel}>
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
