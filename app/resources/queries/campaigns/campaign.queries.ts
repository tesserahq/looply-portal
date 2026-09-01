import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import {
  CampaignEngagementTimelineType,
  CampaignStatsType,
  CampaignType,
  CreateCampaignPayload,
  UpdateCampaignPayload,
} from './campaign.type'

const CAMPAIGNS_ENDPOINT = '/campaigns'

/**
 * List all campaigns with pagination.
 */
export async function getCampaigns(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<CampaignType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}${CAMPAIGNS_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<CampaignType>
}

/**
 * Get a campaign by ID.
 */
export async function getCampaign(config: IQueryConfig, id: string): Promise<CampaignType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${CAMPAIGNS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'GET',
  })

  return response as CampaignType
}

/**
 * Get computed engagement metrics for a campaign.
 */
export async function getCampaignStats(
  config: IQueryConfig,
  id: string
): Promise<CampaignStatsType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${CAMPAIGNS_ENDPOINT}/${id}/stats`, token, nodeEnv, {
    method: 'GET',
  })

  return response as CampaignStatsType
}

/**
 * Get a campaign's opens/clicks bucketed by time elapsed since send.
 */
export async function getCampaignEngagementTimeline(
  config: IQueryConfig,
  id: string
): Promise<CampaignEngagementTimelineType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}${CAMPAIGNS_ENDPOINT}/${id}/stats/engagement-timeline`,
    token,
    nodeEnv,
    { method: 'GET' }
  )

  return response as CampaignEngagementTimelineType
}

/**
 * Create a new campaign.
 */
export async function createCampaign(
  config: IQueryConfig,
  data: CreateCampaignPayload
): Promise<CampaignType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${CAMPAIGNS_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as CampaignType
}

/**
 * Update a campaign by ID.
 */
export async function updateCampaign(
  config: IQueryConfig,
  id: string,
  data: UpdateCampaignPayload
): Promise<CampaignType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${CAMPAIGNS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  return response as CampaignType
}

/**
 * Delete a campaign by ID.
 */
export async function deleteCampaign(config: IQueryConfig, id: string): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${CAMPAIGNS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}

/**
 * Send a campaign by ID.
 */
export async function sendCampaign(config: IQueryConfig, id: string): Promise<CampaignType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${CAMPAIGNS_ENDPOINT}/${id}/send`, token, nodeEnv, {
    method: 'POST',
  })

  return response as CampaignType
}
