import {
  fetchWaitingListMembers,
  fetchWaitingListMembersByStatus,
  fetchWaitingListStatuses,
  addWaitingListMembers,
  updateWaitingListMemberStatus,
  bulkUpdateWaitingListMemberStatus,
  removeWaitingListMember,
  removeAllWaitingListMembers,
} from '@/resources/queries/waiting-lists/waiting-list-member.queries'
import {
  WaitingListMemberQueryConfig,
  AddWaitingListMembersData,
  UpdateWaitingListMemberStatusData,
  BulkUpdateWaitingListMemberStatusData,
  WaitingListMemberType,
} from '@/resources/queries/waiting-lists/waiting-list-member.type'
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
 * Waiting list member query keys for React Query Caching
 */
export const waitingListMemberQueryKeys = {
  all: ['waiting-list-members'] as const,
  lists: () => [...waitingListMemberQueryKeys.all, 'list'] as const,
  list: (waitingListId: string) =>
    [...waitingListMemberQueryKeys.lists(), waitingListId] as const,
  listByStatus: (waitingListId: string, status: string) =>
    [...waitingListMemberQueryKeys.list(waitingListId), 'status', status] as const,
  statuses: () => [...waitingListMemberQueryKeys.all, 'statuses'] as const,
}

/**
 * Hook for fetching waiting list members
 * @waitingListId - Waiting list ID
 * @config - Waiting list member query configuration
 * @options - Waiting list member query options
 */
export function useWaitingListMembers(
  config: WaitingListMemberQueryConfig,
  waitingListId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  },
) {
  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useQuery({
    queryKey: waitingListMemberQueryKeys.list(waitingListId),
    queryFn: async () => {
      try {
        const response = await fetchWaitingListMembers(waitingListId, config)
        return response.members || []
      } catch (error) {
        throw new QueryError('Failed to fetch waiting list members', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!waitingListId,
  })
}

/**
 * Hook for fetching waiting list members by status
 * @waitingListId - Waiting list ID
 * @status - Status to filter by
 * @config - Waiting list member query configuration
 * @options - Waiting list member query options
 */
export function useWaitingListMembersByStatus(
  config: WaitingListMemberQueryConfig,
  waitingListId: string,
  status: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  },
) {
  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useQuery({
    queryKey: waitingListMemberQueryKeys.listByStatus(waitingListId, status),
    queryFn: async () => {
      try {
        const response = await fetchWaitingListMembersByStatus(
          waitingListId,
          status,
          config,
        )
        return (response.members || []) as WaitingListMemberType[]
      } catch (error) {
        throw new QueryError(
          'Failed to fetch waiting list members by status',
          'FETCH_ERROR',
          error,
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!waitingListId && !!status,
  })
}

/**
 * Hook for fetching waiting list statuses
 * @config - Waiting list member query configuration
 * @options - Waiting list member query options
 */
export function useWaitingListStatuses(
  config: WaitingListMemberQueryConfig,
  options?: {
    enabled?: boolean
    staleTime?: number
  },
) {
  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useQuery({
    queryKey: waitingListMemberQueryKeys.statuses(),
    queryFn: async () => {
      try {
        const response = await fetchWaitingListStatuses(config)
        return response.items || []
      } catch (error) {
        throw new QueryError(
          'Failed to fetch waiting list statuses',
          'FETCH_ERROR',
          error,
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false,
  })
}

/**
 * Hook for adding members to waiting list
 */
export function useAddWaitingListMembers(
  config: WaitingListMemberQueryConfig,
  waitingListId: string,
  options?: {
    onSuccess?: () => void
    onError?: (error: QueryError) => void
  },
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async (data: AddWaitingListMembersData): Promise<void> => {
      return await addWaitingListMembers(waitingListId, config, data)
    },
    onSuccess: () => {
      // Invalidate and refetch members lists
      queryClient.invalidateQueries({
        queryKey: waitingListMemberQueryKeys.list(waitingListId),
      })

      toast.success('Members added successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to add members', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating member status in waiting list
 */
export function useUpdateWaitingListMemberStatus(
  config: WaitingListMemberQueryConfig,
  waitingListId: string,
  options?: {
    onSuccess?: () => void
    onError?: (error: QueryError) => void
  },
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async ({
      memberId,
      data,
    }: {
      memberId: string
      data: UpdateWaitingListMemberStatusData
    }): Promise<void> => {
      return await updateWaitingListMemberStatus(waitingListId, memberId, config, data)
    },
    onSuccess: () => {
      // Invalidate and refetch members lists
      queryClient.invalidateQueries({
        queryKey: waitingListMemberQueryKeys.list(waitingListId),
      })

      toast.success('Member status updated successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update member status', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for removing a member from waiting list
 */
export function useRemoveWaitingListMember(
  config: WaitingListMemberQueryConfig,
  waitingListId: string,
  options?: {
    onSuccess?: () => void
    onError?: (error: QueryError) => void
  },
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async (memberId: string): Promise<void> => {
      return await removeWaitingListMember(waitingListId, memberId, config)
    },
    onSuccess: () => {
      // Invalidate and refetch members lists
      queryClient.invalidateQueries({
        queryKey: waitingListMemberQueryKeys.list(waitingListId),
      })

      toast.success('Member removed successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to remove member', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for removing all members from waiting list
 */
export function useRemoveAllWaitingListMembers(
  config: WaitingListMemberQueryConfig,
  waitingListId: string,
  options?: {
    onSuccess?: () => void
    onError?: (error: QueryError) => void
  },
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async (): Promise<void> => {
      return await removeAllWaitingListMembers(waitingListId, config)
    },
    onSuccess: () => {
      // Invalidate and refetch members lists
      queryClient.invalidateQueries({
        queryKey: waitingListMemberQueryKeys.list(waitingListId),
      })

      toast.success('All members removed successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to remove all members', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for bulk updating member statuses in waiting list
 */
export function useBulkUpdateWaitingListMemberStatus(
  config: WaitingListMemberQueryConfig,
  waitingListId: string,
  options?: {
    onSuccess?: () => void
    onError?: (error: QueryError) => void
  },
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async (data: BulkUpdateWaitingListMemberStatusData): Promise<void> => {
      return await bulkUpdateWaitingListMemberStatus(waitingListId, config, data)
    },
    onSuccess: () => {
      // Invalidate and refetch members lists
      queryClient.invalidateQueries({
        queryKey: waitingListMemberQueryKeys.list(waitingListId),
      })

      toast.success('Member statuses updated successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update member statuses', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}
