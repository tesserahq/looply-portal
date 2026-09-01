import { EventFieldMappingForm } from '@/components/crud-forms/event-field-mapping-form'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from 'tessera-ui'
import {
  useEventFieldMappingDetail,
  useUpdateEventFieldMapping,
} from '@/resources/hooks/event-field-mappings'
import { EventFieldMappingFormValue } from '@/resources/queries/event-field-mappings/event-field-mapping.schema'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function EventFieldMappingEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { event_mapping_id, mapping_id } = useParams<{
    event_mapping_id: string
    mapping_id: string
  }>()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { data: mapping, isLoading } = useEventFieldMappingDetail(
    config,
    event_mapping_id!,
    mapping_id!,
    { enabled: !!event_mapping_id && !!mapping_id }
  )

  const { mutateAsync: updateMapping } = useUpdateEventFieldMapping(config, event_mapping_id!, {
    onSuccess: () => {
      navigate(`/event-mappings/${event_mapping_id}/fields`)
    },
  })

  const handleSubmit = async (data: EventFieldMappingFormValue): Promise<void> => {
    await updateMapping({
      id: mapping_id!,
      updateData:
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
            },
    })
  }

  if (isLoading) {
    return <AppPreloader />
  }

  if (!mapping) {
    return null
  }

  return (
    <EventFieldMappingForm
      config={config}
      title="Edit Field Mapping"
      defaultValues={{
        source_path: mapping.source_path,
        target_type: mapping.target_type,
        target_field: mapping.target_field || '',
        field_name: mapping.field_name || '',
      }}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/event-mappings/${event_mapping_id}/fields`)}
    />
  )
}
