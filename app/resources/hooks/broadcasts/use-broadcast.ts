import { getBroadcast } from '@/resources/queries/broadcasts/broadcast.queries'
import { IQueryConfig, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useQuery } from '@tanstack/react-query'

/**
 * Broadcast query keys for React Query Caching
 */
export const broadcastQueryKeys = {
  all: ['broadcasts'] as const,
  details: () => [...broadcastQueryKeys.all, 'detail'] as const,
  detail: (batchId: string) => [...broadcastQueryKeys.details(), batchId] as const,
}

/**
 * Hook for fetching a broadcast by batch ID (Sendly API)
 * @config - Broadcast query configuration
 * @batchId - Broadcast batch ID
 * @options - Broadcast query options
 */
export function useBroadcast(
  config: IQueryConfig,
  batchId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: broadcastQueryKeys.detail(batchId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getBroadcast(config, batchId)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch broadcast',
          'FETCH_ERROR',
          error,
          toApiError(error, 'sendly broadcast')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!batchId && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}
