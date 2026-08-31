import {
  createTrackedEventType,
  deleteTrackedEventType,
  getTrackedEventType,
  getTrackedEventTypes,
} from '@/resources/queries/tracked-event-types/tracked-event-type.queries'
import {
  CreateTrackedEventTypePayload,
  TrackedEventTypeType,
} from '@/resources/queries/tracked-event-types/tracked-event-type.type'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'tessera-ui/components'

/**
 * Tracked event type query keys for React Query caching
 */
export const trackedEventTypeQueryKeys = {
  all: ['tracked-event-types'] as const,
  lists: () => [...trackedEventTypeQueryKeys.all, 'list'] as const,
  list: (config: IQueryConfig, params?: IQueryParams) =>
    [...trackedEventTypeQueryKeys.lists(), config, params] as const,
  details: () => [...trackedEventTypeQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...trackedEventTypeQueryKeys.details(), id] as const,
}

/**
 * Hook for fetching paginated tracked event types
 */
export function useTrackedEventTypes(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: trackedEventTypeQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getTrackedEventTypes(config, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch tracked event types',
          'FETCH_ERROR',
          error,
          toApiError(error, 'tracked event types')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching a single tracked event type
 */
export function useTrackedEventTypeDetail(
  config: IQueryConfig,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: trackedEventTypeQueryKeys.detail(id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getTrackedEventType(config, id)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch tracked event type',
          'FETCH_ERROR',
          error,
          toApiError(error, 'tracked event type')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!id && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for registering a new tracked event type
 */
export function useCreateTrackedEventType(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: TrackedEventTypeType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTrackedEventTypePayload): Promise<TrackedEventTypeType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await createTrackedEventType(config, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trackedEventTypeQueryKeys.lists() })

      toast.success(`"${data.event_type}" is now tracked!`)

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to register tracked event type', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting a tracked event type
 */
export function useDeleteTrackedEventType(
  config: IQueryConfig,
  options?: {
    onSuccess?: () => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await deleteTrackedEventType(config, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackedEventTypeQueryKeys.lists() })

      toast.success('Tracked event type removed successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to remove tracked event type', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}
