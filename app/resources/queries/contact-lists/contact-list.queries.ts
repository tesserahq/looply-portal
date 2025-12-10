import { fetchApi } from '@/libraries/fetch'
import {
  ContactListQueryParams,
  ContactListQueryConfig,
  ContactListFormData,
  ContactListType,
} from './contact-list.type'
import { IPaging } from '@/resources/types'

/**
 * List all contact lists with pagination.
 */
export async function fetchContactLists(
  config: ContactListQueryConfig,
  params: ContactListQueryParams,
) {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}/contact-lists`, token, nodeEnv, {
    params: { page, size },
  })

  return response as IPaging<ContactListType>
}

/**
 * Get a contact list by ID.
 */
export async function fetchContactListDetail(
  contactListId: string,
  config: ContactListQueryConfig,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}`,
    token,
    nodeEnv,
  )

  return response as ContactListType
}

/**
 * Create a new contact list.
 */
export async function createContactList(
  config: ContactListQueryConfig,
  data: ContactListFormData,
) {
  const { apiUrl, token, nodeEnv } = config

  const payload = {
    name: data.name,
    description: data.description || '',
    is_public: data.is_public || false,
  }

  const response = await fetchApi(`${apiUrl}/contact-lists`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response as ContactListType
}

/**
 * Update a contact list by ID.
 */
export async function updateContactList(
  config: ContactListQueryConfig,
  contactListId: string,
  updateData: Partial<ContactListFormData>,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}`,
    token,
    nodeEnv,
    {
      method: 'PUT',
      body: JSON.stringify(updateData),
    },
  )

  return response as ContactListType
}

/**
 * Delete a contact list.
 */
export async function deleteContactList(
  config: ContactListQueryConfig,
  contactListId: string,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}`,
    token,
    nodeEnv,
    {
      method: 'DELETE',
    },
  )

  return response
}
