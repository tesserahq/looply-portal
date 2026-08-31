import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import { CreateTrackedEventTypePayload, TrackedEventTypeType } from './tracked-event-type.type'

const TRACKED_EVENT_TYPES_ENDPOINT = '/tracked-event-types'

/**
 * List all tracked event types with pagination.
 */
export async function getTrackedEventTypes(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<TrackedEventTypeType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}${TRACKED_EVENT_TYPES_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<TrackedEventTypeType>
}

/**
 * Get a tracked event type by ID.
 */
export async function getTrackedEventType(
  config: IQueryConfig,
  id: string
): Promise<TrackedEventTypeType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}${TRACKED_EVENT_TYPES_ENDPOINT}/${id}`,
    token,
    nodeEnv,
    { method: 'GET' }
  )

  return response as TrackedEventTypeType
}

/**
 * Register a new event_type to track.
 */
export async function createTrackedEventType(
  config: IQueryConfig,
  data: CreateTrackedEventTypePayload
): Promise<TrackedEventTypeType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${TRACKED_EVENT_TYPES_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as TrackedEventTypeType
}

/**
 * Delete a tracked event type by ID.
 */
export async function deleteTrackedEventType(config: IQueryConfig, id: string): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${TRACKED_EVENT_TYPES_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}
