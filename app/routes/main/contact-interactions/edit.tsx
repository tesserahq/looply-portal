import { ContactInteractionForm } from '@/components/crud-forms/contact-interaction-form'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from 'tessera-ui'
import {
  useContactInteractionDetail,
  useUpdateContactInteraction,
} from '@/resources/hooks/contact-interactions'
import {
  ContactInteractionFormData,
  contactInteractionToFormValues,
} from '@/resources/queries/contact-interactions'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactInteractionEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { contact_interaction_id } = useParams<{ contact_interaction_id: string }>()

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const { data: interaction, isLoading } = useContactInteractionDetail(config, contact_interaction_id!)

  // Contact interaction update mutation
  const { mutateAsync: updateContactInteraction } = useUpdateContactInteraction(config, {
    onSuccess: () => {
      navigate(`/contact-interactions/${contact_interaction_id}`)
    },
  })

  const handleSubmit = async (data: ContactInteractionFormData): Promise<void> => {
    await updateContactInteraction({ id: contact_interaction_id!, updateData: data })
  }

  if (isLoading) {
    return <AppPreloader />
  }

  if (!interaction) {
    return null
  }

  const defaultValues = contactInteractionToFormValues(interaction)

  return (
    <ContactInteractionForm
      apiUrl={apiUrl!}
      nodeEnv={nodeEnv}
      onSubmit={handleSubmit}
      defaultValues={defaultValues}
      submitLabel="Update"
    />
  )
}
