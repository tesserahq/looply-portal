import { ContactInteractionForm } from '@/components/crud-forms/contact-interaction-form'
import { useApp } from '@/context/AppContext'
import { useCreateContactInteraction } from '@/resources/hooks/contact-interactions'
import {
  ContactInteractionFormData,
  ContactInteractionType,
} from '@/resources/queries/contact-interactions'
import { defaultContactInteractionFormValues } from '@/resources/queries/contact-interactions/contact-interaction.schema'
import { useLoaderData, useNavigate } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactInteractionNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  // Contact interaction create mutation
  const { mutateAsync: createContactInteraction } = useCreateContactInteraction(
    { apiUrl: apiUrl!, token: token!, nodeEnv },
    {
      onSuccess: (data: ContactInteractionType) => {
        navigate(`/contact-interactions/${data.id}`)
      },
    }
  )

  const handleSubmit = async (data: ContactInteractionFormData): Promise<void> => {
    await createContactInteraction(data)
  }

  return (
    <ContactInteractionForm
      apiUrl={apiUrl!}
      nodeEnv={nodeEnv}
      onSubmit={handleSubmit}
      defaultValues={defaultContactInteractionFormValues}
    />
  )
}
