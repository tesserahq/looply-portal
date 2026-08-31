import {
  createEventFieldMapping,
  deleteEventFieldMapping,
  getEventFieldMapping,
  getEventFieldMappings,
} from '@/resources/queries/event-field-mappings/event-field-mapping.queries'
import {
  CreateEventFieldMappingPayload,
  EventFieldMappingType,
} from '@/resources/queries/event-field-mappings/event-field-mapping.type'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'tessera-ui/components'

/**
 * Event field mapping query keys for React Query caching
 */
export const eventFieldMappingQueryKeys = {
  all: ['event-field-mappings'] as const,
  lists: () => [...eventFieldMappingQueryKeys.all, 'list'] as const,
  list: (config: IQueryConfig, params?: IQueryParams) =>
    [...eventFieldMappingQueryKeys.lists(), config, params] as const,
  details: () => [...eventFieldMappingQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventFieldMappingQueryKeys.details(), id] as const,
}

/**
 * Hook for fetching paginated event-to-field mappings
 */
export function useEventFieldMappings(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: eventFieldMappingQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getEventFieldMappings(config, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch event field mappings',
          'FETCH_ERROR',
          error,
          toApiError(error, 'event field mappings')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching a single event-to-field mapping
 */
export function useEventFieldMappingDetail(
  config: IQueryConfig,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: eventFieldMappingQueryKeys.detail(id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getEventFieldMapping(config, id)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch event field mapping',
          'FETCH_ERROR',
          error,
          toApiError(error, 'event field mapping')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!id && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for creating a new event-to-field mapping
 */
export function useCreateEventFieldMapping(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: EventFieldMappingType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateEventFieldMappingPayload): Promise<EventFieldMappingType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await createEventFieldMapping(config, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventFieldMappingQueryKeys.lists() })

      toast.success(`Mapping for "${data.event_type}" → "${data.field_name}" created!`)

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create event field mapping', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting an event-to-field mapping
 */
export function useDeleteEventFieldMapping(
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
      return await deleteEventFieldMapping(config, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventFieldMappingQueryKeys.lists() })

      toast.success('Mapping removed successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to remove mapping', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}
