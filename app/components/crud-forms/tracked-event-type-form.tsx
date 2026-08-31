import { Button } from '@/modules/shadcn/ui/button'
import {
  defaultTrackedEventTypeFormValues,
  trackedEventTypeFormSchema,
  TrackedEventTypeFormValue,
} from '@/resources/queries/tracked-event-types/tracked-event-type.schema'
import { CreateTrackedEventTypePayload } from '@/resources/queries/tracked-event-types'
import { useNavigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

interface TrackedEventTypeFormProps {
  onSubmit: (data: CreateTrackedEventTypePayload) => Promise<void> | void
}

export const TrackedEventTypeForm = ({ onSubmit }: TrackedEventTypeFormProps) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = async (data: TrackedEventTypeFormValue) => {
    setIsSubmitting(true)

    try {
      await onSubmit({ event_type: data.event_type })
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      schema={trackedEventTypeFormSchema}
      defaultValues={defaultTrackedEventTypeFormValues}
      onSubmit={handleSubmit}>
      <FormLayout title="Track New Event Type">
        <Form.Input
          field="event_type"
          label="Event Type"
          placeholder="e.g. com.mylinden.person.created"
          description="The exact event_type Looply should start acting on. Everything else received on the shared NATS stream is ignored - no contact resolution, no event recorded, no field mapping applied. Cannot be changed later - delete and recreate instead."
          required
          autoFocus
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/tracked-event-types')}>
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
