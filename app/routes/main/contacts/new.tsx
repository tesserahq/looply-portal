import { ContactForm } from '@/components/crud-forms/contact-form'
import { useApp } from '@/context/AppContext'
import { useCreateContact } from '@/resources/hooks/contacts'
import { ContactFormData, ContactType } from '@/resources/queries/contacts/contact.type'
import { defaultContactFormValues } from '@/resources/queries/contacts/contact.schema'
import { useLoaderData, useNavigate } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  const config = {
    apiUrl: apiUrl!,
    token: token!,
    nodeEnv,
  }

  // Contact create mutation
  const { mutateAsync: createContact } = useCreateContact(config, {
    onSuccess: (data: ContactType) => {
      navigate(`/contacts/${data.id}`)
    },
  })

  const handleSubmit = async (data: ContactFormData): Promise<void> => {
    await createContact(data)
  }

  return <ContactForm onSubmit={handleSubmit} defaultValues={defaultContactFormValues} />
}
