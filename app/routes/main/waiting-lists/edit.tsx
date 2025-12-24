import { WaitingListForm } from '@/components/crud-forms/waiting-list-form'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from '@/context/AppContext'
import { useWaitingListDetail, useUpdateWaitingList } from '@/resources/hooks/waiting-lists'
import { WaitingListFormData, waitingListToFormValues } from '@/resources/queries/waiting-lists'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function WaitingListEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const { data: waitingList, isLoading } = useWaitingListDetail(config, id!)

  // Waiting list update mutation
  const { mutateAsync: updateWaitingList } = useUpdateWaitingList(config, {
    onSuccess: () => {
      navigate(`/waiting-lists/${id}`)
    },
  })

  const handleSubmit = async (data: WaitingListFormData): Promise<void> => {
    await updateWaitingList({ id: id!, updateData: data })
  }

  if (isLoading) {
    return <AppPreloader />
  }

  if (!waitingList) {
    return null
  }

  const defaultValues = waitingListToFormValues(waitingList)

  return (
    <WaitingListForm onSubmit={handleSubmit} defaultValues={defaultValues} submitLabel="Update" />
  )
}
