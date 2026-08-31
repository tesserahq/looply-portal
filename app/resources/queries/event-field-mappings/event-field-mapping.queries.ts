import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import { CreateEventFieldMappingPayload, EventFieldMappingType } from './event-field-mapping.type'

const EVENT_FIELD_MAPPINGS_ENDPOINT = '/event-field-mappings'

/**
 * List all event-to-field mappings with pagination.
 */
export async function getEventFieldMappings(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<EventFieldMappingType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}${EVENT_FIELD_MAPPINGS_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<EventFieldMappingType>
}

/**
 * Get an event-to-field mapping by ID.
 */
export async function getEventFieldMapping(
  config: IQueryConfig,
  id: string
): Promise<EventFieldMappingType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}${EVENT_FIELD_MAPPINGS_ENDPOINT}/${id}`,
    token,
    nodeEnv,
    { method: 'GET' }
  )

  return response as EventFieldMappingType
}

/**
 * Create a new event-to-field mapping.
 */
export async function createEventFieldMapping(
  config: IQueryConfig,
  data: CreateEventFieldMappingPayload
): Promise<EventFieldMappingType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${EVENT_FIELD_MAPPINGS_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as EventFieldMappingType
}

/**
 * Delete an event-to-field mapping by ID.
 */
export async function deleteEventFieldMapping(config: IQueryConfig, id: string): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${EVENT_FIELD_MAPPINGS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}
