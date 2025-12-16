import { fetchApi } from '@/libraries/fetch'
import { StatsQueryConfig, StatsDataType } from './stats.type'

/**
 * Get statistics data.
 */
export async function fetchStats(config: StatsQueryConfig) {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}/stats`, token, nodeEnv)

  return response?.data as StatsDataType
}
