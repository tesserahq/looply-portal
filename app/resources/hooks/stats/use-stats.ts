import { fetchStats } from '@/resources/queries/stats/stats.queries'
import { StatsQueryConfig } from '@/resources/queries/stats/stats.type'
import { useQuery } from '@tanstack/react-query'

/**
 * Custom error class for query errors
 */
class QueryError extends Error {
  code?: string
  details?: unknown

  constructor(message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'QueryError'
    this.code = code
    this.details = details
  }
}

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
  return useQuery({
    queryKey: statsQueryKeys.detail(),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await fetchStats(config)
      } catch (error) {
        throw new QueryError('Failed to fetch stats', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false,
  })
}
