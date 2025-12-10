import { NodeENVType } from '@/libraries/fetch'

/**
 * Contact List Type
 */
export type ContactListType = {
  id: string
  name: string
  description: string
  is_public?: boolean
  created_by_id: string
  created_at: string
  updated_at: string
}

/**
 * Contact list form data type for creating/updating
 */
export type ContactListFormData = {
  name: string
  description?: string
  is_public?: boolean
}

/**
 * Contact list query configuration
 * Required configuration for API queries (apiUrl, token, nodeEnv)
 */
export interface ContactListQueryConfig {
  apiUrl: string
  token: string
  nodeEnv: NodeENVType
}

/**
 * Contact list response type
 */
export interface ContactListQueryParams {
  page?: number
  size?: number
}
