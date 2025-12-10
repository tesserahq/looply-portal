import { ContactInteractionForm } from '@/components/crud-forms/contact-interaction-form'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from '@/context/AppContext'
import {
  useContactInteractionDetail,
  useUpdateContactInteraction,
} from '@/resources/hooks/contact-interactions'
import {
  ContactInteractionFormData,
  contactInteractionToFormValues,
} from '@/resources/queries/contact-interactions'
import { useLoaderData, useNavigate, useParams } from '@remix-run/react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactInteractionEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const { data: interaction, isLoading } = useContactInteractionDetail(config, id!)

  // Contact interaction update mutation
  const { mutateAsync: updateContactInteraction } = useUpdateContactInteraction(config, {
    onSuccess: () => {
      navigate(`/contact-interactions/${id}`)
    },
  })

  const handleSubmit = async (data: ContactInteractionFormData): Promise<void> => {
    await updateContactInteraction({ id: id!, updateData: data })
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
