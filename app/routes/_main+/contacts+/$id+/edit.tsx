import { ContactForm } from '@/components/crud-forms/contact-form'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from '@/context/AppContext'
import { useContactDetail, useUpdateContact } from '@/resources/hooks/contacts'
import { ContactFormData } from '@/resources/queries/contacts/contact.type'
import { contactToFormValues } from '@/resources/queries/contacts/contact.utils'
import { useLoaderData, useNavigate, useParams } from '@remix-run/react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const { data: contact, isLoading } = useContactDetail(config, id!, {
    enabled: !!id && !!token,
  })

  // Contact update mutation
  const { mutateAsync: updateContact } = useUpdateContact(config, {
    onSuccess: (data) => {
      navigate(`/contacts/${data.id}`)
    },
  })

  const handleSubmit = async (data: ContactFormData): Promise<void> => {
    await updateContact({ id: id!, updateData: data })
  }

  if (isLoading) {
    return <AppPreloader />
  }

  if (!contact) {
    return null
  }

  const defaultValues = contactToFormValues(contact)

  return <ContactForm onSubmit={handleSubmit} defaultValues={defaultValues} submitLabel="Update" />
}
