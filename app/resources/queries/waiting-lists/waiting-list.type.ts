import { NodeENVType } from '@/libraries/fetch'

/**
 * Waiting List Type
 */
export type WaitingListType = {
  id: string
  name: string
  description: string
  created_by_id: string
  created_at: string
  updated_at: string
}

/**
 * Waiting list form data type for creating/updating
 */
export type WaitingListFormData = {
  name: string
  description?: string
}

/**
 * Waiting list query configuration
 * Required configuration for API queries (apiUrl, token, nodeEnv)
 */
export interface WaitingListQueryConfig {
  apiUrl: string
  token: string
  nodeEnv: NodeENVType
}

/**
 * Waiting list response type
 */
export interface WaitingListQueryParams {
  page?: number
  size?: number
  q?: string
}
