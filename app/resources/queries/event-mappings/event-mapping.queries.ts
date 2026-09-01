import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import {
  CreateEventMappingPayload,
  EventMappingType,
  UpdateEventMappingPayload,
} from './event-mapping.type'

const EVENT_MAPPINGS_ENDPOINT = '/event-mappings'

/**
 * List all active event mappings with pagination.
 */
export async function getEventMappings(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<EventMappingType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}${EVENT_MAPPINGS_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<EventMappingType>
}

/**
 * Get an event mapping by ID.
 */
export async function getEventMapping(config: IQueryConfig, id: string): Promise<EventMappingType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${EVENT_MAPPINGS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'GET',
  })

  return response as EventMappingType
}

/**
 * Register a new event_type, optionally with its identity configuration.
 */
export async function createEventMapping(
  config: IQueryConfig,
  data: CreateEventMappingPayload
): Promise<EventMappingType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${EVENT_MAPPINGS_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as EventMappingType
}

/**
 * Update an event mapping's source/identity configuration in place.
 */
export async function updateEventMapping(
  config: IQueryConfig,
  id: string,
  data: UpdateEventMappingPayload
): Promise<EventMappingType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${EVENT_MAPPINGS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

  return response as EventMappingType
}

/**
 * Delete an event mapping by ID - cascades to soft-delete its field mappings.
 */
export async function deleteEventMapping(config: IQueryConfig, id: string): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${EVENT_MAPPINGS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}
