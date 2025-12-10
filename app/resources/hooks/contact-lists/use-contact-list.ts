import {
  createContactList,
  deleteContactList,
  fetchContactListDetail,
  fetchContactLists,
  updateContactList,
} from '@/resources/queries/contact-lists/contact-list.queries'
import {
  ContactListFormData,
  ContactListQueryConfig,
  ContactListQueryParams,
  ContactListType,
} from '@/resources/queries/contact-lists/contact-list.type'
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
 * Contact list query keys for React Query Caching
 */
export const contactListQueryKeys = {
  all: ['contact-lists'] as const,
  lists: () => [...contactListQueryKeys.all, 'list'] as const,
  list: (config: ContactListQueryConfig, params?: ContactListQueryParams) =>
    [...contactListQueryKeys.lists(), config, params] as const,
  details: () => [...contactListQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactListQueryKeys.details(), id] as const,
}

/**
 * Hook for fetching paginated contact lists
 * @config - Contact list query configuration
 * @params - Contact list query parameters
 * @options - Contact list query options
 */
export function useContactLists(
  config: ContactListQueryConfig,
  params: ContactListQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  },
) {
  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useQuery({
    queryKey: contactListQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        return await fetchContactLists(config, params)
      } catch (error) {
        throw new QueryError('Failed to fetch contact lists', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false,
  })
}

/**
 * Hook for fetching contact list detail
 * @contactListId - Contact list ID
 * @config - Contact list query configuration
 * @options - Contact list query options
 */
export function useContactListDetail(
  config: ContactListQueryConfig,
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
    queryKey: contactListQueryKeys.detail(contactListId),
    queryFn: async () => {
      try {
        return await fetchContactListDetail(contactListId, config)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch contact list detail',
          'FETCH_ERROR',
          error,
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!contactListId,
  })
}

/**
 * Hook for creating contact list
 */
export function useCreateContactList(
  config: ContactListQueryConfig,
  options?: {
    onSuccess?: (data: ContactListType) => void
    onError?: (error: QueryError) => void
  },
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async (data: ContactListFormData): Promise<ContactListType> => {
      return await createContactList(config, data)
    },
    onSuccess: (data) => {
      // Invalidate and refetch contact lists lists
      queryClient.invalidateQueries({ queryKey: contactListQueryKeys.lists() })

      toast.success('Contact List created successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create contact list', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating contact list
 */
export function useUpdateContactList(
  config: ContactListQueryConfig,
  options?: {
    onSuccess?: (data: ContactListType) => void
    onError?: (error: QueryError) => void
  },
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
      updateData: Partial<ContactListFormData>
    }): Promise<ContactListType> => {
      return await updateContactList(config, id, updateData)
    },
    onSuccess: (data) => {
      // Update specific item cache
      queryClient.setQueryData(contactListQueryKeys.detail(data.id), data)

      // Invalidate and refetch contact lists lists
      queryClient.invalidateQueries({ queryKey: contactListQueryKeys.lists() })

      toast.success('Contact List updated successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update contact list', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting contact list
 */
export function useDeleteContactList(
  config: ContactListQueryConfig,
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
    mutationFn: async (id: string): Promise<ContactListType> => {
      return await deleteContactList(config, id)
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: contactListQueryKeys.detail(id) })

      // Invalidate and refetch contact lists lists
      queryClient.invalidateQueries({ queryKey: contactListQueryKeys.lists() })

      toast.success('Contact List deleted successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to delete contact list', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

