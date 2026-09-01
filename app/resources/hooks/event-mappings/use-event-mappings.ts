import {
  createEventMapping,
  deleteEventMapping,
  getEventMapping,
  getEventMappings,
  updateEventMapping,
} from '@/resources/queries/event-mappings/event-mapping.queries'
import {
  CreateEventMappingPayload,
  EventMappingType,
  UpdateEventMappingPayload,
} from '@/resources/queries/event-mappings/event-mapping.type'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'tessera-ui/components'

/**
 * Event mapping query keys for React Query caching
 */
export const eventMappingQueryKeys = {
  all: ['event-mappings'] as const,
  lists: () => [...eventMappingQueryKeys.all, 'list'] as const,
  list: (config: IQueryConfig, params?: IQueryParams) =>
    [...eventMappingQueryKeys.lists(), config, params] as const,
  details: () => [...eventMappingQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventMappingQueryKeys.details(), id] as const,
}

/**
 * Hook for fetching paginated event mappings
 */
export function useEventMappings(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: eventMappingQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getEventMappings(config, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch event mappings',
          'FETCH_ERROR',
          error,
          toApiError(error, 'event mappings')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching a single event mapping
 */
export function useEventMappingDetail(
  config: IQueryConfig,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: eventMappingQueryKeys.detail(id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getEventMapping(config, id)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch event mapping',
          'FETCH_ERROR',
          error,
          toApiError(error, 'event mapping')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!id && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for registering a new event mapping
 */
export function useCreateEventMapping(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: EventMappingType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateEventMappingPayload): Promise<EventMappingType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await createEventMapping(config, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventMappingQueryKeys.lists() })

      toast.success(`"${data.event_type}" is now registered!`)

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to register event mapping', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating an event mapping's source/identity configuration
 */
export function useUpdateEventMapping(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: EventMappingType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updateData,
    }: {
      id: string
      updateData: UpdateEventMappingPayload
    }): Promise<EventMappingType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await updateEventMapping(config, id, updateData)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(eventMappingQueryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: eventMappingQueryKeys.lists() })

      toast.success(`"${data.event_type}" updated successfully!`)

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update event mapping', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting an event mapping - cascades to its field mappings
 */
export function useDeleteEventMapping(
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
      return await deleteEventMapping(config, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventMappingQueryKeys.lists() })

      toast.success('Event mapping removed successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to remove event mapping', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}
