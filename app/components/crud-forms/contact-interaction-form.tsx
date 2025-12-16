import { useApp } from '@/context/AppContext'
import { NodeENVType } from '@/libraries/fetch'
import { Button } from '@/modules/shadcn/ui/button'
import {
  ContactInteractionFormData,
  ContactInteractionFormValue,
  formValuesToContactInteractionData,
} from '@/resources/queries/contact-interactions'
import { contactInteractionFormSchema } from '@/resources/queries/contact-interactions/contact-interaction.schema'
import { useNavigate } from '@remix-run/react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

interface ContactListFormProps {
  apiUrl: string
  nodeEnv: NodeENVType
  defaultValues: ContactInteractionFormValue
  onSubmit: (data: ContactInteractionFormData) => Promise<void> | void
  submitLabel?: string
}

export const ContactInteractionForm = ({
  apiUrl,
  nodeEnv,
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
}: ContactListFormProps) => {
  const navigate = useNavigate()
  const { token } = useApp()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const title = defaultValues?.id ? 'Edit Contact Interaction' : 'New Contact Interaction'

  // Handle form submission
  const handleSubmit = async (data: ContactInteractionFormValue) => {
    setIsSubmitting(true)

    try {
      const contactInteractionData = formValuesToContactInteractionData(data)
      await onSubmit(contactInteractionData)
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      schema={contactInteractionFormSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}>
      <FormLayout title={title}>
        <Form.Contacts
          field="contact_id"
          apiUrl={apiUrl}
          nodeEnv={nodeEnv}
          label="Contacts"
          placeholder="Select a contact"
          required
        />

        <Form.Textarea field="note" label="Notes" required />

        <Form.DateTimePicker
          field="interaction_timestamp"
          label="Interaction Time"
          placeholder="Pick date and time"
          required
        />

        <Form.DateTimePicker
          field="action_timestamp"
          label="Next action on"
          placeholder="Pick date and time"
        />

        <Form.InteractionActions
          field="action"
          label="Action"
          apiUrl={apiUrl}
          token={token!}
          nodeEnv={nodeEnv}
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/contact-interactions')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </FormLayout>
    </Form>
  )
}
