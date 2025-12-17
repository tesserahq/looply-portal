import {
  createWaitingList,
  deleteWaitingList,
  fetchWaitingListDetail,
  fetchWaitingLists,
  updateWaitingList,
} from '@/resources/queries/waiting-lists/waiting-list.queries'
import {
  WaitingListFormData,
  WaitingListQueryConfig,
  WaitingListQueryParams,
  WaitingListType,
} from '@/resources/queries/waiting-lists/waiting-list.type'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
 * Waiting list query keys for React Query Caching
 */
export const waitingListQueryKeys = {
  all: ['waiting-lists'] as const,
  lists: () => [...waitingListQueryKeys.all, 'list'] as const,
  list: (config: WaitingListQueryConfig, params?: WaitingListQueryParams) =>
    [...waitingListQueryKeys.lists(), config, params] as const,
  details: () => [...waitingListQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...waitingListQueryKeys.details(), id] as const,
}

/**
 * Hook for fetching paginated waiting lists
 * @config - Waiting list query configuration
 * @params - Waiting list query parameters
 * @options - Waiting list query options
 */
export function useWaitingLists(
  config: WaitingListQueryConfig,
  params: WaitingListQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useQuery({
    queryKey: waitingListQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        return await fetchWaitingLists(config, params)
      } catch (error) {
        throw new QueryError('Failed to fetch waiting lists', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false,
  })
}

/**
 * Hook for fetching waiting list detail
 * @waitingListId - Waiting list ID
 * @config - Waiting list query configuration
 * @options - Waiting list query options
 */
export function useWaitingListDetail(
  config: WaitingListQueryConfig,
  waitingListId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useQuery({
    queryKey: waitingListQueryKeys.detail(waitingListId),
    queryFn: async () => {
      try {
        return await fetchWaitingListDetail(waitingListId, config)
      } catch (error) {
        throw new QueryError('Failed to fetch waiting list detail', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!waitingListId,
  })
}

/**
 * Hook for creating waiting list
 */
export function useCreateWaitingList(
  config: WaitingListQueryConfig,
  options?: {
    onSuccess?: (data: WaitingListType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async (data: WaitingListFormData): Promise<WaitingListType> => {
      return await createWaitingList(config, data)
    },
    onSuccess: (data) => {
      // Invalidate and refetch waiting lists lists
      queryClient.invalidateQueries({ queryKey: waitingListQueryKeys.lists() })

      toast.success('Waiting List created successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create waiting list', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating waiting list
 */
export function useUpdateWaitingList(
  config: WaitingListQueryConfig,
  options?: {
    onSuccess?: (data: WaitingListType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async ({
      id,
      updateData,
    }: {
      id: string
      updateData: Partial<WaitingListFormData>
    }): Promise<WaitingListType> => {
      return await updateWaitingList(config, id, updateData)
    },
    onSuccess: (data) => {
      // Update specific item cache
      queryClient.setQueryData(waitingListQueryKeys.detail(data.id), data)

      // Invalidate and refetch waiting lists lists
      queryClient.invalidateQueries({ queryKey: waitingListQueryKeys.lists() })

      toast.success('Waiting List updated successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update waiting list', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting waiting list
 */
export function useDeleteWaitingList(
  config: WaitingListQueryConfig,
  options?: {
    onSuccess?: () => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async (id: string): Promise<WaitingListType> => {
      return await deleteWaitingList(config, id)
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: waitingListQueryKeys.detail(id) })

      // Invalidate and refetch waiting lists lists
      queryClient.invalidateQueries({ queryKey: waitingListQueryKeys.lists() })

      toast.success('Waiting List deleted successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to delete waiting list', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}
