import { EventMappingForm } from '@/components/crud-forms/event-mapping-form'
import { useApp } from 'tessera-ui'
import { useCreateEventMapping } from '@/resources/hooks/event-mappings'
import { CreateEventMappingPayload } from '@/resources/queries/event-mappings'
import { useLoaderData, useNavigate } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function EventMappingNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { mutateAsync: createEventMapping } = useCreateEventMapping(config, {
    onSuccess: (data) => {
      navigate(`/event-mappings/${data.id}`)
    },
  })

  const handleSubmit = async (data: CreateEventMappingPayload): Promise<void> => {
    await createEventMapping(data)
  }

  return <EventMappingForm onSubmit={handleSubmit} />
}
