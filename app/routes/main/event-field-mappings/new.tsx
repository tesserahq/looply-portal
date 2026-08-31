import { EventFieldMappingForm } from '@/components/crud-forms/event-field-mapping-form'
import { useApp } from 'tessera-ui'
import { useCreateEventFieldMapping } from '@/resources/hooks/event-field-mappings'
import { CreateEventFieldMappingPayload } from '@/resources/queries/event-field-mappings'
import { useLoaderData, useNavigate } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function EventFieldMappingNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { mutateAsync: createMapping } = useCreateEventFieldMapping(config, {
    onSuccess: () => {
      navigate('/event-field-mappings')
    },
  })

  const handleSubmit = async (data: CreateEventFieldMappingPayload): Promise<void> => {
    await createMapping(data)
  }

  return <EventFieldMappingForm config={config} onSubmit={handleSubmit} />
}
