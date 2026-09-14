import { fetchApi } from '@/libraries/fetch'
import {
  ContactQueryParams,
  ContactQueryConfig,
  ContactType,
  ContactTypeOption,
  ContactStatusOption,
  CreateContactData,
  UpdateContactData,
} from './contact.type'
import { IPaging } from '@/resources/types/pagination'

/**
 * List all contacts with pagination. /contacts now accepts q, status,
 * contact_type, and tags together (all filters AND together server-side).
 */
export async function fetchContacts(config: ContactQueryConfig, params: ContactQueryParams) {
  const { apiUrl, token, nodeEnv } = config
  const { page, size, q, status, contact_type, tags } = params

  const filterParams: Record<string, string> = {}
  if (q && q.trim() !== '') filterParams.q = q
  if (status && status.trim() !== '') filterParams.status = status
  if (contact_type && contact_type.trim() !== '') filterParams.contact_type = contact_type
  if (tags && tags.trim() !== '') filterParams.tags = tags

  const response = await fetchApi(`${apiUrl}/contacts`, token, nodeEnv, {
    pagination: {
      page,
      size,
    },
    params: Object.keys(filterParams).length > 0 ? filterParams : undefined,
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
 * List the fixed set of contact statuses (active/inactive/pending) available
 * to assign to a contact.
 */
export async function fetchContactStatuses(config: ContactQueryConfig) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}/contacts/contact-statuses`, token, nodeEnv, {
    pagination: { page: 1, size: 100 },
  })

  return response as IPaging<ContactStatusOption>
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
