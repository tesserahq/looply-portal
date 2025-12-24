import { WaitingListForm } from '@/components/crud-forms/waiting-list-form'
import { useApp } from '@/context/AppContext'
import { useCreateWaitingList } from '@/resources/hooks/waiting-lists'
import { WaitingListFormData, WaitingListType } from '@/resources/queries/waiting-lists'
import { defaultWaitingListFormValues } from '@/resources/queries/waiting-lists/waiting-list.schema'
import { useLoaderData, useNavigate } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function WaitingListNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  // Waiting list create mutation
  const { mutateAsync: createWaitingList } = useCreateWaitingList(
    { apiUrl: apiUrl!, token: token!, nodeEnv },
    {
      onSuccess: (data: WaitingListType) => {
        navigate(`/waiting-lists/${data.id}`)
      },
    }
  )

  const handleSubmit = async (data: WaitingListFormData): Promise<void> => {
    await createWaitingList(data)
  }

  return <WaitingListForm onSubmit={handleSubmit} defaultValues={defaultWaitingListFormValues} />
}
