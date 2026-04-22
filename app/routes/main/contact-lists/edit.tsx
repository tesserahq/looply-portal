import { ContactListForm } from '@/components/crud-forms/contact-list-form'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from 'tessera-ui'
import { useContactListDetail, useUpdateContactList } from '@/resources/hooks/contact-lists'
import { ContactListFormData, contactListToFormValues } from '@/resources/queries/contact-lists'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactListEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { contact_list_id } = useParams<{ contact_list_id: string }>()

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const { data: contactList, isLoading } = useContactListDetail(config, contact_list_id!)

  // Contact list update mutation
  const { mutateAsync: updateContactList } = useUpdateContactList(config, {
    onSuccess: () => {
      navigate(`/contact-lists/${contact_list_id}`)
    },
  })

  const handleSubmit = async (data: ContactListFormData): Promise<void> => {
    await updateContactList({ id: contact_list_id!, updateData: data })
  }

  if (isLoading) {
    return <AppPreloader />
  }

  if (!contactList) {
    return null
  }

  const defaultValues = contactListToFormValues(contactList)

  return (
    <ContactListForm onSubmit={handleSubmit} defaultValues={defaultValues} submitLabel="Update" />
  )
}
