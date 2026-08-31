import { Button } from '@/modules/shadcn/ui/button'
import {
  customFieldDefinitionFormSchema,
  CustomFieldDefinitionFormValue,
  defaultCustomFieldDefinitionFormValues,
} from '@/resources/queries/custom-fields/custom-field.schema'
import { CreateCustomFieldDefinitionPayload } from '@/resources/queries/custom-fields'
import { useNavigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

const valueTypeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
]

interface CustomFieldDefinitionFormProps {
  onSubmit: (data: CreateCustomFieldDefinitionPayload) => Promise<void> | void
}

export const CustomFieldDefinitionForm = ({ onSubmit }: CustomFieldDefinitionFormProps) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = async (data: CustomFieldDefinitionFormValue) => {
    setIsSubmitting(true)

    try {
      await onSubmit({
        name: data.name,
        value_type: data.value_type,
        label: data.label || undefined,
      })
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      schema={customFieldDefinitionFormSchema}
      defaultValues={defaultCustomFieldDefinitionFormValues}
      onSubmit={handleSubmit}>
      <FormLayout title="New Custom Field">
        <Form.Input
          field="name"
          label="Name"
          placeholder="e.g. family_member_count"
          description="The machine name written into segment rules. Cannot be changed later - delete and recreate instead."
          required
          autoFocus
        />

        <Form.Select
          field="value_type"
          label="Value Type"
          options={valueTypeOptions}
          description="Locks the type every value written under this field must match. Cannot be changed later."
          required
        />

        <Form.Input
          field="label"
          label="Label"
          placeholder="e.g. Family Members (optional)"
          description="A friendlier display name, separate from the machine name above."
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate('/custom-fields')}>
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
