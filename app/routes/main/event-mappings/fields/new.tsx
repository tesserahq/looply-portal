import { EventFieldMappingForm } from '@/components/crud-forms/event-field-mapping-form'
import { useApp } from 'tessera-ui'
import { useCreateEventFieldMapping } from '@/resources/hooks/event-field-mappings'
import { EventFieldMappingFormValue } from '@/resources/queries/event-field-mappings/event-field-mapping.schema'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function EventFieldMappingNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { event_mapping_id } = useParams<{ event_mapping_id: string }>()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { mutateAsync: createMapping } = useCreateEventFieldMapping(config, event_mapping_id!, {
    onSuccess: () => {
      navigate(`/event-mappings/${event_mapping_id}/fields`)
    },
  })

  const handleSubmit = async (data: EventFieldMappingFormValue): Promise<void> => {
    await createMapping(
      data.target_type === 'contact_field'
        ? {
            source_path: data.source_path,
            target_type: 'contact_field',
            target_field: data.target_field,
          }
        : {
            source_path: data.source_path,
            target_type: 'custom_field',
            field_name: data.field_name,
          }
    )
  }

  return (
    <EventFieldMappingForm
      config={config}
      title="New Field Mapping"
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/event-mappings/${event_mapping_id}/fields`)}
    />
  )
}
