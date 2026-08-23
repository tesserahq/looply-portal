import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types/pagination'
import {
  ContactListMemberQueryConfig,
  ContactListMemberQueryParams,
  ContactListMemberType,
  AddContactListMembersData,
} from './contact-list-member.type'

/**
 * Get members of a contact list, paginated.
 */
export async function fetchContactListMembers(
  contactListId: string,
  config: ContactListMemberQueryConfig,
  params: ContactListMemberQueryParams
) {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}/members`,
    token,
    nodeEnv,
    {
      pagination: {
        page,
        size,
      },
    }
  )

  return response as IPaging<ContactListMemberType>
}

/**
 * Add members to a contact list.
 */
export async function addContactListMembers(
  contactListId: string,
  config: ContactListMemberQueryConfig,
  data: AddContactListMembersData
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}/members`,
    token,
    nodeEnv,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )

  return response
}

/**
 * Remove a member from a contact list.
 */
export async function removeContactListMember(
  contactListId: string,
  memberId: string,
  config: ContactListMemberQueryConfig
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}/members/${memberId}`,
    token,
    nodeEnv,
    {
      method: 'DELETE',
    }
  )

  return response
}

/**
 * Remove all members from a contact list.
 */
export async function removeAllContactListMembers(
  contactListId: string,
  config: ContactListMemberQueryConfig
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contact-lists/${contactListId}/members`,
    token,
    nodeEnv,
    {
      method: 'DELETE',
    }
  )

  return response
}
