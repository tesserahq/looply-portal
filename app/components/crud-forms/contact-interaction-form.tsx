import { useApp } from '@/context/AppContext'
import { NodeENVType } from '@/libraries/fetch'
import { Button } from '@/modules/shadcn/ui/button'
import { useContacts } from '@/resources/hooks/contacts'
import { useContactInteractionActions } from '@/resources/hooks/contact-interactions'
import {
  ContactInteractionFormData,
  ContactInteractionFormValue,
  ContactInteractionActionType,
  formValuesToContactInteractionData,
} from '@/resources/queries/contact-interactions'
import { contactInteractionFormSchema } from '@/resources/queries/contact-interactions/contact-interaction.schema'
import { useNavigate } from '@remix-run/react'
import { useMemo, useState } from 'react'
import { FormLayout } from '../form/form-layout'
import { Form } from '../form'
import { type SelectOption } from '../form/form-select'
import { Loader2 } from 'lucide-react'

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

  // Get contacts
  const { data: contacts, isLoading: isLoadingContacts } = useContacts(
    { apiUrl, token: token!, nodeEnv },
    { page: 1, size: 100 },
  )

  // Get contact interaction actions
  const { data: actions, isLoading: isLoadingActions } = useContactInteractionActions({
    apiUrl,
    token: token!,
    nodeEnv,
  })

  const title = defaultValues?.id ? 'Edit Contact Interaction' : 'New Contact Interaction'

  // Handle form submission
  const handleSubmit = async (data: ContactInteractionFormValue) => {
    setIsSubmitting(true)

    try {
      const contactInteractionData = formValuesToContactInteractionData(data)
      await onSubmit(contactInteractionData)
    } catch (error) {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  // Transform contacts to SelectOption format
  const contactOptions: SelectOption[] = useMemo(() => {
    return (
      contacts?.items.map((contact) => ({
        value: contact.id,
        label: contact.email,
      })) || []
    )
  }, [contacts])

  // Transform actions to SelectOption format
  const actionOptions: SelectOption[] = useMemo(() => {
    return (
      actions?.items.map((action: ContactInteractionActionType) => ({
        value: action.value,
        label: action.label,
      })) || []
    )
  }, [actions])

  return (
    <Form
      schema={contactInteractionFormSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}>
      <input type="hidden" name="token" value={token!} />
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
      <FormLayout title={title}>
        <Form.Select
          field="contact_id"
          label="Contacts"
          placeholder="Select a contact"
          options={contactOptions}
          isLoading={isLoadingContacts}
          required
        />

        <Form.Select
          field="action"
          label="Action"
          placeholder="Select an action"
          options={actionOptions}
          isLoading={isLoadingActions}
          required
        />

        <Form.Textarea field="note" label="Note" required />

        <Form.DateTimePicker
          field="interaction_timestamp"
          label="Interaction Time"
          placeholder="Pick date and time"
          required
        />

        <Form.DateTimePicker
          field="action_timestamp"
          label="Action Time"
          placeholder="Pick date and time"
          required
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
