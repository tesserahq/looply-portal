import { NodeENVType } from '@/libraries/fetch'
import { ContactType } from '@/resources/queries/contacts'

/**
 * Contact List Member Type (same as Contact)
 */
export type ContactListMemberType = ContactType

/**
 * Add members to contact list form data
 */
export type AddContactListMembersData = {
  contact_ids: string[]
}

/**
 * Contact list member query parameters for pagination
 */
export interface ContactListMemberQueryParams {
  page?: number
  size?: number
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
