import { Button } from '@/modules/shadcn/ui/button'
import {
  WaitingListFormData,
  WaitingListFormValue,
  formValuesToWaitingListData,
} from '@/resources/queries/waiting-lists'
import { waitingListFormSchema } from '@/resources/queries/waiting-lists/waiting-list.schema'
import { useNavigate } from '@remix-run/react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

interface WaitingListFormProps {
  defaultValues: WaitingListFormValue
  onSubmit: (data: WaitingListFormData) => Promise<void> | void
  submitLabel?: string
}

export const WaitingListForm = ({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
}: WaitingListFormProps) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const title = defaultValues?.id ? 'Edit Waiting List' : 'New Waiting List'

  // Handle form submission
  const handleSubmit = async (data: WaitingListFormValue) => {
    setIsSubmitting(true)

    try {
      const waitingListData = formValuesToWaitingListData(data)
      await onSubmit(waitingListData)
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form schema={waitingListFormSchema} defaultValues={defaultValues} onSubmit={handleSubmit}>
      <FormLayout title={title}>
        <Form.Input field="name" label="Name" placeholder="Enter waiting list name" required />

        <Form.Textarea
          field="description"
          label="Description"
          placeholder="Enter description (optional)"
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate('/waiting-lists')}>
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
