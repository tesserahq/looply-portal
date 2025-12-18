import { fetchApi } from '@/libraries/fetch'
import {
  ContactQueryParams,
  ContactQueryConfig,
  ContactType,
  CreateContactData,
  UpdateContactData,
} from './contact.type'
import { IPaging } from '@/resources/types/pagination'

/**
 * List all contacts with pagination.
 * Uses /contacts endpoint for listing and /contacts/search for search queries.
 */
export async function fetchContacts(config: ContactQueryConfig, params: ContactQueryParams) {
  const { apiUrl, token, nodeEnv } = config
  const { page, size, q } = params

  // Use search endpoint if query parameter is provided
  const hasSearchQuery = q && q.trim() !== ''
  const endpoint = hasSearchQuery ? `${apiUrl}/contacts/search` : `${apiUrl}/contacts`

  const response = await fetchApi(endpoint, token, nodeEnv, {
    pagination: {
      page,
      size,
    },
    // For search endpoint, include q as a query parameter
    params: hasSearchQuery ? { q } : undefined,
  })

  return response as IPaging<ContactType>
}

/**
 * Get a single contact by ID.
 */
export async function fetchContactDetail(contactId: string, config: ContactQueryConfig) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}/contacts/${contactId}`, token, nodeEnv)

  return response as ContactType
}

/**
 * Create a new contact.
 */
export async function createContact(config: ContactQueryConfig, data: CreateContactData) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}/contacts`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as ContactType
}

/**
 * Update an existing contact.
 */
export async function updateContact(
  contactId: string,
  config: ContactQueryConfig,
  data: UpdateContactData
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}/contacts/${contactId}`, token, nodeEnv, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  return response as ContactType
}

/**
 * Delete a contact.
 */
export async function deleteContact(contactId: string, config: ContactQueryConfig) {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}/contacts/${contactId}`, token, nodeEnv, {
    method: 'DELETE',
  })
}
