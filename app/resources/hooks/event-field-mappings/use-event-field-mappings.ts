import {
  createEventFieldMapping,
  deleteEventFieldMapping,
  getEventFieldMapping,
  getEventFieldMappings,
  updateEventFieldMapping,
} from '@/resources/queries/event-field-mappings/event-field-mapping.queries'
import {
  CreateEventFieldMappingPayload,
  EventFieldMappingType,
  UpdateEventFieldMappingPayload,
} from '@/resources/queries/event-field-mappings/event-field-mapping.type'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'tessera-ui/components'

/**
 * Event field mapping query keys for React Query caching - scoped under
 * their parent event mapping id, since a field mapping only ever makes sense
 * in that context.
 */
export const eventFieldMappingQueryKeys = {
  all: (eventMappingId: string) => ['event-mappings', eventMappingId, 'fields'] as const,
  lists: (eventMappingId: string) =>
    [...eventFieldMappingQueryKeys.all(eventMappingId), 'list'] as const,
  list: (eventMappingId: string, config: IQueryConfig, params?: IQueryParams) =>
    [...eventFieldMappingQueryKeys.lists(eventMappingId), config, params] as const,
  details: (eventMappingId: string) =>
    [...eventFieldMappingQueryKeys.all(eventMappingId), 'detail'] as const,
  detail: (eventMappingId: string, id: string) =>
    [...eventFieldMappingQueryKeys.details(eventMappingId), id] as const,
}

/**
 * Hook for fetching paginated attribute mappings under an event mapping
 */
export function useEventFieldMappings(
  config: IQueryConfig,
  eventMappingId: string,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: eventFieldMappingQueryKeys.list(eventMappingId, config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getEventFieldMappings(config, eventMappingId, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch field mappings',
          'FETCH_ERROR',
          error,
          toApiError(error, 'field mappings')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!eventMappingId && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching a single attribute mapping
 */
export function useEventFieldMappingDetail(
  config: IQueryConfig,
  eventMappingId: string,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: eventFieldMappingQueryKeys.detail(eventMappingId, id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getEventFieldMapping(config, eventMappingId, id)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch field mapping',
          'FETCH_ERROR',
          error,
          toApiError(error, 'field mapping')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!eventMappingId && !!id && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for creating a new attribute mapping under an event mapping
 */
export function useCreateEventFieldMapping(
  config: IQueryConfig,
  eventMappingId: string,
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
      return await createEventFieldMapping(config, eventMappingId, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventFieldMappingQueryKeys.lists(eventMappingId) })

      toast.success(
        `Mapping for "${data.target_type === 'contact_field' ? data.target_field : data.field_name}" created!`
      )

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create field mapping', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating an attribute mapping's source_path/target in place
 */
export function useUpdateEventFieldMapping(
  config: IQueryConfig,
  eventMappingId: string,
  options?: {
    onSuccess?: (data: EventFieldMappingType) => void
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
      updateData: UpdateEventFieldMappingPayload
    }): Promise<EventFieldMappingType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await updateEventFieldMapping(config, eventMappingId, id, updateData)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(eventFieldMappingQueryKeys.detail(eventMappingId, data.id), data)
      queryClient.invalidateQueries({ queryKey: eventFieldMappingQueryKeys.lists(eventMappingId) })

      toast.success('Field mapping updated successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update field mapping', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting an attribute mapping
 */
export function useDeleteEventFieldMapping(
  config: IQueryConfig,
  eventMappingId: string,
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
      return await deleteEventFieldMapping(config, eventMappingId, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventFieldMappingQueryKeys.lists(eventMappingId) })

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
