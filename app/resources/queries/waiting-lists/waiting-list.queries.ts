import { fetchApi } from '@/libraries/fetch'
import {
  WaitingListQueryParams,
  WaitingListQueryConfig,
  WaitingListFormData,
  WaitingListType,
} from './waiting-list.type'
import { IPaging } from '@/resources/types'

/**
 * List all waiting lists with pagination.
 */
export async function fetchWaitingLists(
  config: WaitingListQueryConfig,
  params: WaitingListQueryParams
) {
  const { apiUrl, token, nodeEnv } = config
  const { page, size, q } = params

  // Determine endpoint and params based on search query
  const hasSearchQuery = q && q.trim() !== ''
  const endpoint = hasSearchQuery ? `${apiUrl}/waiting-lists/search` : `${apiUrl}/waiting-lists`
  const queryParams = hasSearchQuery ? { page, size, q } : { page, size }

  const response = await fetchApi(endpoint, token, nodeEnv, {
    params: queryParams,
  })

  return response as IPaging<WaitingListType>
}

/**
 * Get a waiting list by ID.
 */
export async function fetchWaitingListDetail(
  waitingListId: string,
  config: WaitingListQueryConfig
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}/waiting-lists/${waitingListId}`, token, nodeEnv)

  return response as WaitingListType
}

/**
 * Create a new waiting list.
 */
export async function createWaitingList(config: WaitingListQueryConfig, data: WaitingListFormData) {
  const { apiUrl, token, nodeEnv } = config

  const payload = {
    name: data.name,
    description: data.description || '',
  }

  const response = await fetchApi(`${apiUrl}/waiting-lists`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response as WaitingListType
}

/**
 * Update a waiting list by ID.
 */
export async function updateWaitingList(
  config: WaitingListQueryConfig,
  waitingListId: string,
  updateData: Partial<WaitingListFormData>
) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}/waiting-lists/${waitingListId}`, token, nodeEnv, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  })

  return response as WaitingListType
}

/**
 * Delete a waiting list.
 */
export async function deleteWaitingList(config: WaitingListQueryConfig, waitingListId: string) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}/waiting-lists/${waitingListId}`, token, nodeEnv, {
    method: 'DELETE',
  })

  return response
}
