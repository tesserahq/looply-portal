import { ContactListForm } from '@/components/crud-forms/contact-list-form'
import { useApp } from '@/context/AppContext'
import { useCreateContactList } from '@/resources/hooks/contact-lists'
import { ContactListFormData, ContactListType } from '@/resources/queries/contact-lists'
import { defaultContactListFormValues } from '@/resources/queries/contact-lists/contact-list.schema'
import { useLoaderData, useNavigate } from '@remix-run/react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactListNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  // Contact list create mutation
  const { mutateAsync: createContactList } = useCreateContactList(
    { apiUrl: apiUrl!, token: token!, nodeEnv },
    {
      onSuccess: (data: ContactListType) => {
        navigate(`/contact-lists/${data.id}`)
      },
    },
  )

  const handleSubmit = async (data: ContactListFormData): Promise<void> => {
    await createContactList(data)
  }

  return (
    <ContactListForm
      onSubmit={handleSubmit}
      defaultValues={defaultContactListFormValues}
    />
  )
}
