import { fetchApi } from '@/libraries/fetch'
import {
  ContactListMemberQueryConfig,
  ContactListMembersResponse,
  AddContactListMembersData,
  ContactListMemberType,
} from './contact-list-member.type'

/**
 * Get all members of a contact list.
 */
export async function fetchContactListMembers(
  contactListId: string,
  config: ContactListMemberQueryConfig,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}/members`,
    token,
    nodeEnv,
  )

  return response as ContactListMembersResponse
}

/**
 * Add members to a contact list.
 */
export async function addContactListMembers(
  contactListId: string,
  config: ContactListMemberQueryConfig,
  data: AddContactListMembersData,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}/members`,
    token,
    nodeEnv,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )

  return response
}

/**
 * Remove a member from a contact list.
 */
export async function removeContactListMember(
  contactListId: string,
  memberId: string,
  config: ContactListMemberQueryConfig,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}/members/${memberId}`,
    token,
    nodeEnv,
    {
      method: 'DELETE',
    },
  )

  return response
}

/**
 * Remove all members from a contact list.
 */
export async function removeAllContactListMembers(
  contactListId: string,
  config: ContactListMemberQueryConfig,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}/members`,
    token,
    nodeEnv,
    {
      method: 'DELETE',
    },
  )

  return response
}

