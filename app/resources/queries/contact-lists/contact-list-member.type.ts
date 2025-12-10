import { NodeENVType } from '@/libraries/fetch'
import { ContactType } from '@/resources/queries/contacts'

/**
 * Contact List Member Type (same as Contact)
 */
export type ContactListMemberType = ContactType

/**
 * Contact list members response type
 */
export interface ContactListMembersResponse {
  members: ContactListMemberType[]
}

/**
 * Add members to contact list form data
 */
export type AddContactListMembersData = {
  contact_ids: string[]
}

/**
 * Contact list member query configuration
 * Required configuration for API queries (apiUrl, token, nodeEnv)
 */
export interface ContactListMemberQueryConfig {
  apiUrl: string
  token: string
  nodeEnv: NodeENVType
}
