import { NodeENVType } from '@/libraries/fetch'
import { ContactType } from '../contacts'

/**
 * Waiting List Member Type
 */
export type WaitingListMemberType = {
  id: string
  status: string
  contact: ContactType
}

/**
 * Waiting List Status Type
 */
export type WaitingListStatusType = {
  value: string
  label: string
  description: string
}

/**
 * Waiting list members response type
 */
export interface WaitingListMembersResponse {
  members: WaitingListMemberType[]
}

/**
 * Waiting list statuses response type
 */
export interface WaitingListStatusesResponse {
  items: WaitingListStatusType[]
}

/**
 * Add members to waiting list form data
 */
export type AddWaitingListMembersData = {
  contact_ids: string[]
  status?: string
}

/**
 * Update member status form data
 */
export type UpdateWaitingListMemberStatusData = {
  status: string
}

/**
 * Bulk update member status form data
 */
export type BulkUpdateWaitingListMemberStatusData = {
  contact_ids: string[]
  status: string
}

/**
 * Waiting list member query configuration
 * Required configuration for API queries (apiUrl, token, nodeEnv)
 */
export interface WaitingListMemberQueryConfig {
  apiUrl: string
  token: string
  nodeEnv: NodeENVType
}
