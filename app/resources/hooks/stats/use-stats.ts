import { fetchStats } from '@/resources/queries/stats/stats.queries'
import { StatsQueryConfig } from '@/resources/queries/stats/stats.type'
import { QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useQuery } from '@tanstack/react-query'

/**
 * Stats query keys for React Query Caching
 */
export const statsQueryKeys = {
  all: ['stats'] as const,
  detail: () => [...statsQueryKeys.all, 'detail'] as const,
}

/**
 * Hook for fetching stats
 * @config - Stats query configuration
 * @options - Stats query options
 */
export function useStats(
  config: StatsQueryConfig,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: statsQueryKeys.detail(),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await fetchStats(config)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch stats',
          'FETCH_ERROR',
          error,
          toApiError(error, 'the overview stats')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}
