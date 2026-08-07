import { fetchApi } from '@/libraries/fetch'
import { IQueryConfig } from '..'
import { BroadcastType } from './broadcast.type'

const BROADCASTS_ENDPOINT = '/broadcasts'

/**
 * Get a broadcast by batch ID (Sendly API).
 */
export async function getBroadcast(config: IQueryConfig, batchId: string): Promise<BroadcastType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${BROADCASTS_ENDPOINT}/${batchId}`, token, nodeEnv, {
    method: 'GET',
  })

  return response as BroadcastType
}
