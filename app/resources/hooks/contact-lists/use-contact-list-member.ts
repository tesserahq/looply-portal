import {
  fetchContactListMembers,
  addContactListMembers,
  removeContactListMember,
  removeAllContactListMembers,
} from '@/resources/queries/contact-lists/contact-list-member.queries'
import {
  ContactListMemberQueryConfig,
  AddContactListMembersData,
} from '@/resources/queries/contact-lists/contact-list-member.type'
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
 * Contact list member query keys for React Query Caching
 */
export const contactListMemberQueryKeys = {
  all: ['contact-list-members'] as const,
  lists: () => [...contactListMemberQueryKeys.all, 'list'] as const,
  list: (contactListId: string) =>
    [...contactListMemberQueryKeys.lists(), contactListId] as const,
}

/**
 * Hook for fetching contact list members
 * @contactListId - Contact list ID
 * @config - Contact list member query configuration
 * @options - Contact list member query options
 */
export function useContactListMembers(
  config: ContactListMemberQueryConfig,
  contactListId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  },
) {
  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useQuery({
    queryKey: contactListMemberQueryKeys.list(contactListId),
    queryFn: async () => {
      try {
        const response = await fetchContactListMembers(contactListId, config)
        return response.members || []
      } catch (error) {
        throw new QueryError('Failed to fetch contact list members', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!contactListId,
  })
}

/**
 * Hook for adding members to contact list
 */
export function useAddContactListMembers(
  config: ContactListMemberQueryConfig,
  contactListId: string,
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
    mutationFn: async (data: AddContactListMembersData): Promise<void> => {
      return await addContactListMembers(contactListId, config, data)
    },
    onSuccess: () => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({
        queryKey: contactListMemberQueryKeys.list(contactListId),
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
 * Hook for removing a member from contact list
 */
export function useRemoveContactListMember(
  config: ContactListMemberQueryConfig,
  contactListId: string,
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
      return await removeContactListMember(contactListId, memberId, config)
    },
    onSuccess: () => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({
        queryKey: contactListMemberQueryKeys.list(contactListId),
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
 * Hook for removing all members from contact list
 */
export function useRemoveAllContactListMembers(
  config: ContactListMemberQueryConfig,
  contactListId: string,
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
      return await removeAllContactListMembers(contactListId, config)
    },
    onSuccess: () => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({
        queryKey: contactListMemberQueryKeys.list(contactListId),
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
