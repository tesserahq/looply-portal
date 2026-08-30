import { ContactForm } from '@/components/crud-forms/contact-form'
import { useApp } from 'tessera-ui'
import { useCreateContact } from '@/resources/hooks/contacts'
import { ContactFormData } from '@/resources/queries/contacts/contact.type'
import { defaultContactFormValues } from '@/resources/queries/contacts/contact.schema'
import { useLoaderData, useNavigate } from 'react-router'
import { useState } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const [formKey, setFormKey] = useState(0)

  const config = {
    apiUrl: apiUrl!,
    token: token!,
    nodeEnv,
  }

  // Contact create mutation
  const { mutateAsync: createContact } = useCreateContact(config)

  const handleSubmit = async (data: ContactFormData): Promise<void> => {
    const contact = await createContact(data)
    navigate(`/contacts/${contact.id}`)
  }

  const handleSubmitAndAddNew = async (data: ContactFormData): Promise<void> => {
    await createContact(data)
    setFormKey((key) => key + 1)
  }

  return (
    <ContactForm
      key={formKey}
      onSubmit={handleSubmit}
      onSubmitAndAddNew={handleSubmitAndAddNew}
      defaultValues={defaultContactFormValues}
      apiUrl={apiUrl!}
      nodeEnv={nodeEnv}
    />
  )
}
