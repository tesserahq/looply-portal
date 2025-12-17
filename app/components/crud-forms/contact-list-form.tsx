import { Button } from '@/modules/shadcn/ui/button'
import {
  ContactListFormData,
  ContactListFormValue,
  formValuesToContactListData,
} from '@/resources/queries/contact-lists'
import { contactListFormSchema } from '@/resources/queries/contact-lists/contact-list.schema'
import { useNavigate } from '@remix-run/react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

interface ContactListFormProps {
  defaultValues: ContactListFormValue
  onSubmit: (data: ContactListFormData) => Promise<void> | void
  submitLabel?: string
}

export const ContactListForm = ({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
}: ContactListFormProps) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const title = defaultValues?.id ? 'Edit Contact List' : 'New Contact List'

  // Handle form submission
  const handleSubmit = async (data: ContactListFormValue) => {
    setIsSubmitting(true)

    try {
      const contactListData = formValuesToContactListData(data)
      await onSubmit(contactListData)
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form schema={contactListFormSchema} defaultValues={defaultValues} onSubmit={handleSubmit}>
      <FormLayout title={title}>
<<<<<<< HEAD
        <Form.Input
          field="name"
          label="Name"
          placeholder="Enter contact list name"
          required
          autoFocus
        />
=======
        <Form.Input field="name" label="Name" placeholder="Enter contact list name" required />
>>>>>>> a43ae31 (update dependency eslint to v9)

        <Form.Textarea
          field="description"
          label="Description"
          placeholder="Enter description (optional)"
        />

        <Form.Switch field="is_public" label="Public" />

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate('/contact-lists')}>
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
