import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import { CustomEventType } from './custom-event.type'

const CUSTOM_EVENTS_ENDPOINT = '/custom-events'

/**
 * List all custom events, most recent first, with pagination - the global
 * (not contact-scoped) firehose/discovery view: confirming NATS ingestion is
 * actually flowing, and browsing which event_types have been seen.
 */
export async function getCustomEvents(
  config: IQueryConfig,
  params: IQueryParams & { name?: string; contact_id?: string }
): Promise<IPaging<CustomEventType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size, name, contact_id } = params

  const response = await fetchApi(`${apiUrl}${CUSTOM_EVENTS_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
    params: { name, contact_id },
  })

  return response as IPaging<CustomEventType>
}

/**
 * Get a single custom event by ID.
 */
export async function getCustomEvent(config: IQueryConfig, id: string): Promise<CustomEventType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${CUSTOM_EVENTS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'GET',
  })

  return response as CustomEventType
}

/**
 * List a contact's event history, most recent first, keyed by the contact's
 * external_id (user story 11).
 */
export async function getContactCustomEvents(
  config: IQueryConfig,
  externalId: string
): Promise<CustomEventType[]> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contacts/${externalId}/custom-events`,
    token,
    nodeEnv,
    { method: 'GET' }
  )

  return response as CustomEventType[]
}
