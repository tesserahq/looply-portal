import { useApp } from '@/context/AppContext'
import { NodeENVType } from '@/libraries/fetch'
import { Button } from '@/modules/shadcn/ui/button'
import { useCreateContactInteraction } from '@/resources/hooks/contact-interactions'
import { formValuesToContactInteractionData } from '@/resources/queries/contact-interactions'
import {
  contactInteractionFormSchema,
  ContactInteractionFormValue,
  defaultContactInteractionFormValues,
} from '@/resources/queries/contact-interactions/contact-interaction.schema'
import { ContactType } from '@/resources/queries/contacts/contact.type'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shadcn/ui/dialog'
import { Loader2 } from 'lucide-react'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { Form } from '../form'
import { ContactInteractionType } from '@/resources/queries/contact-interactions/contact-interaction.type'
import { useNavigate, useParams } from '@remix-run/react'

interface FuncProps {
  onOpen: (contact: ContactType) => void
  onClose: () => void
}

interface IProps {
  apiUrl: string
  nodeEnv: NodeENVType
}

const ContactInteractionShortcut: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { apiUrl, nodeEnv }: IProps,
  ref,
) => {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const [open, setOpen] = useState<boolean>(false)
  const [contact, setContact] = useState<ContactType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { token } = useApp()

  const config = {
    apiUrl: apiUrl,
    token: token!,
    nodeEnv,
  }

  // Mutation for create
  const { mutateAsync: createContactInteraction } = useCreateContactInteraction(config, {
    onSuccess: (interaction: ContactInteractionType) => {
      // if user created interaction from contact lists it will redirect to the interaction detail page
      if (!params.id) {
        navigate(`/contact-interactions/${interaction.id}`)
      }

      setOpen(false)
    },
  })

  useImperativeHandle(ref, () => ({
    onOpen: (contact: ContactType) => {
      setOpen(true)
      setContact(contact)
    },
    onClose: () => {
      setOpen(false)
    },
  }))

  const handleSubmit = async (data: ContactInteractionFormValue) => {
    setIsSubmitting(true)

    try {
      const contactInteractionData = formValuesToContactInteractionData(data)

      await createContactInteraction(contactInteractionData)
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultValues = {
    ...defaultContactInteractionFormValues,
    contact_id: contact?.id || '',
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader className="mb-3">
          <DialogTitle>New Contact Interaction</DialogTitle>
        </DialogHeader>
        <Form
          schema={contactInteractionFormSchema}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Form.Input
              field="contact_id"
              label="Contact"
              value={contact?.email}
              disabled
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

            <div className="mt-5! flex items-center justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
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
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default forwardRef(ContactInteractionShortcut)
