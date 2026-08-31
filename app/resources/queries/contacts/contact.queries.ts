import { fetchApi } from '@/libraries/fetch'
import {
  ContactQueryParams,
  ContactQueryConfig,
  ContactType,
  ContactTypeOption,
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
  const { page, size, q, tags } = params

  // Tag filtering only exists on /contacts, not /contacts/search - the two
  // facets are mutually exclusive in the UI, so this never has to combine them.
  const hasTagsFilter = tags && tags.trim() !== ''
  const hasSearchQuery = !hasTagsFilter && q && q.trim() !== ''
  const endpoint = hasSearchQuery ? `${apiUrl}/contacts/search` : `${apiUrl}/contacts`

  const response = await fetchApi(endpoint, token, nodeEnv, {
    pagination: {
      page,
      size,
    },
    params: hasSearchQuery ? { q } : hasTagsFilter ? { tags } : undefined,
  })

  return response as IPaging<ContactType>
}

/**
 * List the fixed set of contact types available to assign to a contact.
 */
export async function fetchContactTypes(config: ContactQueryConfig) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}/contacts/contact-types`, token, nodeEnv, {
    pagination: { page: 1, size: 100 },
  })

  return response as IPaging<ContactTypeOption>
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
 * Create multiple contacts in batch.
 */
export async function createBatchContacts(config: ContactQueryConfig, data: CreateContactData[]) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}/contacts/batch`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as ContactType[]
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
