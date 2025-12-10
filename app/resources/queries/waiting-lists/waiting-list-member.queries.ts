import { fetchApi } from '@/libraries/fetch'
import {
  WaitingListMemberQueryConfig,
  WaitingListMembersResponse,
  WaitingListStatusesResponse,
  AddWaitingListMembersData,
  UpdateWaitingListMemberStatusData,
  BulkUpdateWaitingListMemberStatusData,
} from './waiting-list-member.type'
import { ContactType } from '../contacts'

/**
 * Get all members of a waiting list.
 */
export async function fetchWaitingListMembers(
  waitingListId: string,
  config: WaitingListMemberQueryConfig,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/waiting-lists/${waitingListId}/members`,
    token,
    nodeEnv,
  )

  return response as WaitingListMembersResponse
}

/**
 * Get members of a waiting list by status.
 */
export async function fetchWaitingListMembersByStatus(
  waitingListId: string,
  status: string,
  config: WaitingListMemberQueryConfig,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/waiting-lists/${waitingListId}/members/by-status/${status}`,
    token,
    nodeEnv,
  )

  return response as WaitingListMembersResponse | { members: ContactType[] }
}

/**
 * Get all available waiting list member statuses.
 */
export async function fetchWaitingListStatuses(config: WaitingListMemberQueryConfig) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/waiting-lists/member-statuses`,
    token,
    nodeEnv,
  )

  return response as WaitingListStatusesResponse
}

/**
 * Add members to a waiting list.
 */
export async function addWaitingListMembers(
  waitingListId: string,
  config: WaitingListMemberQueryConfig,
  data: AddWaitingListMembersData,
) {
  const { apiUrl, token, nodeEnv } = config

  const payload: { contact_ids: string[]; status?: string } = {
    contact_ids: data.contact_ids,
  }
  if (data.status) {
    payload.status = data.status
  }

  const response = await fetchApi(
    `${apiUrl}/waiting-lists/${waitingListId}/members`,
    token,
    nodeEnv,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  return response
}

/**
 * Update a member's status in a waiting list.
 */
export async function updateWaitingListMemberStatus(
  waitingListId: string,
  memberId: string,
  config: WaitingListMemberQueryConfig,
  data: UpdateWaitingListMemberStatusData,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/waiting-lists/${waitingListId}/members/${memberId}/status?status=${data.status}`,
    token,
    nodeEnv,
    {
      method: 'PUT',
    },
  )

  return response
}

/**
 * Bulk update members' status in a waiting list.
 */
export async function bulkUpdateWaitingListMemberStatus(
  waitingListId: string,
  config: WaitingListMemberQueryConfig,
  data: BulkUpdateWaitingListMemberStatusData,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/waiting-lists/${waitingListId}/members/bulk-status?status=${data.status}`,
    token,
    nodeEnv,
    {
      method: 'POST',
      body: JSON.stringify(data.contact_ids),
    },
  )

  return response
}

/**
 * Remove a member from a waiting list.
 */
export async function removeWaitingListMember(
  waitingListId: string,
  memberId: string,
  config: WaitingListMemberQueryConfig,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/waiting-lists/${waitingListId}/members/${memberId}`,
    token,
    nodeEnv,
    {
      method: 'DELETE',
    },
  )

  return response
}

/**
 * Remove all members from a waiting list.
 */
export async function removeAllWaitingListMembers(
  waitingListId: string,
  config: WaitingListMemberQueryConfig,
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/waiting-lists/${waitingListId}/members`,
    token,
    nodeEnv,
    {
      method: 'DELETE',
    },
  )

  return response
}
