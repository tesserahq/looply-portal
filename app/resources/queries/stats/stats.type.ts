import { NodeENVType } from '@/libraries/fetch'

/**
 * Simplified Contact Type for stats response
 */
export type StatsContactType = {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
  updated_at: string
}

/**
 * Contact Interaction Type with nested contact for stats
 */
export type StatsContactInteractionType = {
  id: string
  contact_id: string
  note: string
  interaction_timestamp: string
  action: string
  custom_action_description?: string
  action_timestamp: string
  created_by_id: string
  created_at: string
  updated_at: string
  contact: StatsContactType
}

/**
 * Stats response data
 */
export type StatsDataType = {
  total_contacts: number
  total_list: number
  total_public_list: number
  total_private_list: number
  upcoming_interactions: StatsContactInteractionType[]
  recent_contacts: StatsContactType[]
}

/**
 * Stats query configuration
 * Required configuration for API queries (apiUrl, token, nodeEnv)
 */
export interface StatsQueryConfig {
  apiUrl: string
  token: string
  nodeEnv: NodeENVType
}
