import { Button } from '@/modules/shadcn/ui/button'
import { defaultTagFormValues, tagFormSchema, TagFormValue } from '@/resources/queries/tags'
import { useNavigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

interface TagFormProps {
  title: string
  defaultValues?: TagFormValue
  onSubmit: (data: TagFormValue) => Promise<void> | void
}

export const TagForm = ({ title, defaultValues, onSubmit }: TagFormProps) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = async (data: TagFormValue) => {
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
      schema={tagFormSchema}
      defaultValues={defaultValues || defaultTagFormValues}
      onSubmit={handleSubmit}>
      <FormLayout title={title}>
        <Form.Input field="name" label="Name" placeholder="e.g. VIP" required autoFocus />

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate('/tags')}>
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
