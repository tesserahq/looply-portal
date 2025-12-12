import { NodeENVType } from '@/libraries/fetch'

/**
 * Contact Interaction Type
 */
export type ContactInteractionType = {
  id: string
  contact_id: string
  note: string
  interaction_timestamp: string
  created_by_id: string
  created_at: string
  updated_at: string
  action_timestamp?: string
  action?: string
  custom_action_description?: string
}

/**
 * Contact interaction form data type for creating/updating
 */
export type ContactInteractionFormData = {
  contact_id: string
  note: string
  interaction_timestamp: string
  action: string
  action_timestamp?: string
  custom_action_description?: string
}

/**
 * Contact interaction query configuration
 * Required configuration for API queries (apiUrl, token, nodeEnv)
 */
export interface ContactInteractionQueryConfig {
  apiUrl: string
  token: string
  nodeEnv: NodeENVType
}

/**
 * Contact interaction response type
 */
export interface ContactInteractionQueryParams {
  page?: number
  size?: number
}

/**
 * Contact interaction action type
 */
export type ContactInteractionActionType = {
  value: string
  label: string
}
