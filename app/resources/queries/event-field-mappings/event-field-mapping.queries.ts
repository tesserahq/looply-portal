import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import {
  CreateEventFieldMappingPayload,
  EventFieldMappingType,
  UpdateEventFieldMappingPayload,
} from './event-field-mapping.type'

const fieldsEndpoint = (eventMappingId: string) => `/event-mappings/${eventMappingId}/fields`

/**
 * List all active attribute mappings for an event mapping, with pagination.
 */
export async function getEventFieldMappings(
  config: IQueryConfig,
  eventMappingId: string,
  params: IQueryParams
): Promise<IPaging<EventFieldMappingType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}${fieldsEndpoint(eventMappingId)}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<EventFieldMappingType>
}

/**
 * Get an attribute mapping by ID, scoped to its parent event mapping.
 */
export async function getEventFieldMapping(
  config: IQueryConfig,
  eventMappingId: string,
  id: string
): Promise<EventFieldMappingType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}${fieldsEndpoint(eventMappingId)}/${id}`,
    token,
    nodeEnv,
    { method: 'GET' }
  )

  return response as EventFieldMappingType
}

/**
 * Create a new attribute mapping under an event mapping.
 */
export async function createEventFieldMapping(
  config: IQueryConfig,
  eventMappingId: string,
  data: CreateEventFieldMappingPayload
): Promise<EventFieldMappingType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${fieldsEndpoint(eventMappingId)}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as EventFieldMappingType
}

/**
 * Update an attribute mapping's source_path/target in place.
 */
export async function updateEventFieldMapping(
  config: IQueryConfig,
  eventMappingId: string,
  id: string,
  data: UpdateEventFieldMappingPayload
): Promise<EventFieldMappingType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}${fieldsEndpoint(eventMappingId)}/${id}`,
    token,
    nodeEnv,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  )

  return response as EventFieldMappingType
}

/**
 * Delete an attribute mapping by ID.
 */
export async function deleteEventFieldMapping(
  config: IQueryConfig,
  eventMappingId: string,
  id: string
): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${fieldsEndpoint(eventMappingId)}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}
