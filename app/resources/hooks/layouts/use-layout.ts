import { getLayout, getLayouts } from '@/resources/queries/layouts/layout.queries'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useQuery } from '@tanstack/react-query'

/**
 * Layout query keys for React Query Caching
 */
export const layoutQueryKeys = {
  all: ['layouts'] as const,
  lists: () => [...layoutQueryKeys.all, 'list'] as const,
  list: (config: IQueryConfig, params?: IQueryParams) =>
    [...layoutQueryKeys.lists(), config, params] as const,
  details: () => [...layoutQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...layoutQueryKeys.details(), id] as const,
}

/**
 * Hook for fetching paginated layouts (Sendly API)
 * @config - Layout query configuration
 * @params - Layout query parameters
 * @options - Layout query options
 */
export function useLayouts(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: layoutQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getLayouts(config, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch layouts',
          'FETCH_ERROR',
          error,
          toApiError(error, 'sendly email layout')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching a layout by ID (Sendly API)
 * @config - Layout query configuration
 * @layoutId - Layout ID
 * @options - Layout query options
 */
export function useLayout(
  config: IQueryConfig,
  layoutId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: layoutQueryKeys.detail(layoutId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getLayout(config, layoutId)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch layout',
          'FETCH_ERROR',
          error,
          toApiError(error, 'sendly email layout')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!config.token && !!layoutId,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}
