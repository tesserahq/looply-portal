import { TrackedEventTypeForm } from '@/components/crud-forms/tracked-event-type-form'
import { useApp } from 'tessera-ui'
import { useCreateTrackedEventType } from '@/resources/hooks/tracked-event-types'
import { CreateTrackedEventTypePayload } from '@/resources/queries/tracked-event-types'
import { useLoaderData, useNavigate } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function TrackedEventTypeNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { mutateAsync: createTracked } = useCreateTrackedEventType(config, {
    onSuccess: () => {
      navigate('/tracked-event-types')
    },
  })

  const handleSubmit = async (data: CreateTrackedEventTypePayload): Promise<void> => {
    await createTracked(data)
  }

  return <TrackedEventTypeForm onSubmit={handleSubmit} />
}
