import { fetchApi } from '@/libraries/fetch'
import {
  ContactInteractionQueryParams,
  ContactInteractionQueryConfig,
  ContactInteractionFormData,
  ContactInteractionType,
  ContactInteractionActionType,
} from './contact-interaction.type'
import { IPaging } from '@/resources/types'

/**
 * List all contact interactions with pagination.
 */
export async function fetchContactInteractions(
  config: ContactInteractionQueryConfig,
  params: ContactInteractionQueryParams,
) {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}/contact-interactions`, token, nodeEnv, {
    pagination: {
      page,
      size,
    },
  })

  return response as IPaging<ContactInteractionType>
}

/**
 * Get a contact interaction by ID.
 */

export async function fetchContactInteractionDetail(
  interactionId: string,
  config: ContactInteractionQueryConfig,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-interactions/${interactionId}`,
    token,
    nodeEnv,
  )

  return response as ContactInteractionType
}

/**
 * Get all available actions for contact interactions.
 */
export async function fetchContactInteractionActions(
  config: ContactInteractionQueryConfig,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-interactions/actions`,
    token,
    nodeEnv,
    {
      method: 'GET',
    },
  )

  return response as IPaging<ContactInteractionActionType>
}

/**
 * Create a new interaction for a contact.
 */
export async function createContactInteraction(
  config: ContactInteractionQueryConfig,
  data: ContactInteractionFormData,
) {
  const { apiUrl, token, nodeEnv } = config

  const payload = {
    note: data.note,
    interaction_timestamp: data.interaction_timestamp,
    action: data.action,
    action_timestamp: data.action_timestamp,
    custom_action_description: data.custom_action_description,
  }

  const response = await fetchApi(
    `${apiUrl}/contacts/${data.contact_id}/interactions`,
    token,
    nodeEnv,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  return response
}

/**
 * Update a contact interaction by ID.
 */
export async function updateContactInteraction(
  config: ContactInteractionQueryConfig,
  interactionId: string,
  updateData: Partial<ContactInteractionFormData>,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-interactions/${interactionId}`,
    token,
    nodeEnv,
    {
      method: 'PUT',
      body: JSON.stringify(updateData),
    },
  )

  return response
}

/**
 * Delete a contact interaction.
 */
export async function deleteContactInteraction(
  config: ContactInteractionQueryConfig,
  interactionId: string,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-interactions/${interactionId}`,
    token,
    nodeEnv,
    {
      method: 'DELETE',
    },
  )

  return response
}
