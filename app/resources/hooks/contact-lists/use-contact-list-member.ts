import {
  fetchContactListMembers,
  addContactListMembers,
  removeContactListMember,
  removeAllContactListMembers,
} from '@/resources/queries/contact-lists/contact-list-member.queries'
import {
  ContactListMemberQueryConfig,
  ContactListMemberQueryParams,
  AddContactListMembersData,
} from '@/resources/queries/contact-lists/contact-list-member.type'
import { QueryError } from '@/resources/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'tessera-ui/components'

/**
 * Contact list member query keys for React Query Caching
 */
export const contactListMemberQueryKeys = {
  all: ['contact-list-members'] as const,
  lists: () => [...contactListMemberQueryKeys.all, 'list'] as const,
  listsForContactList: (contactListId: string) =>
    [...contactListMemberQueryKeys.lists(), contactListId] as const,
  list: (contactListId: string, params: ContactListMemberQueryParams) =>
    [...contactListMemberQueryKeys.listsForContactList(contactListId), params] as const,
}

/**
 * Hook for fetching paginated contact list members
 * @contactListId - Contact list ID
 * @config - Contact list member query configuration
 * @params - Contact list member query parameters
 * @options - Contact list member query options
 */
export function useContactListMembers(
  config: ContactListMemberQueryConfig,
  contactListId: string,
  params: ContactListMemberQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: contactListMemberQueryKeys.list(contactListId, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await fetchContactListMembers(contactListId, config, params)
      } catch (error) {
        throw new QueryError('Failed to fetch contact list members', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!contactListId && !!config.token,
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
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AddContactListMembersData): Promise<void> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await addContactListMembers(contactListId, config, data)
    },
    onSuccess: () => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({
        queryKey: contactListMemberQueryKeys.listsForContactList(contactListId),
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
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberId: string): Promise<void> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await removeContactListMember(contactListId, memberId, config)
    },
    onSuccess: () => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({
        queryKey: contactListMemberQueryKeys.listsForContactList(contactListId),
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
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await removeAllContactListMembers(contactListId, config)
    },
    onSuccess: () => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({
        queryKey: contactListMemberQueryKeys.listsForContactList(contactListId),
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
