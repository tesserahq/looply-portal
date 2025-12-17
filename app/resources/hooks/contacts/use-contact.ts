import {
  fetchContacts,
  fetchContactDetail,
  createContact,
  updateContact,
  deleteContact,
} from '@/resources/queries/contacts/contact.queries'
import {
  ContactQueryConfig,
  ContactQueryParams,
  ContactType,
  ContactFormData,
} from '@/resources/queries/contacts/contact.type'
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
 * Contact query keys for React Query Caching
 */
export const contactQueryKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactQueryKeys.all, 'list'] as const,
  list: (config: ContactQueryConfig, params: ContactQueryParams) =>
    [...contactQueryKeys.lists(), config, params] as const,
  details: () => [...contactQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactQueryKeys.details(), id] as const,
}

/**
 * Hook for fetching paginated contacts
 * @config - Contact query configuration
 * @params - Contact query parameters
 * @options - Contact query options
 */
export function useContacts(
  config: ContactQueryConfig,
  params: ContactQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useQuery({
    queryKey: contactQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        return await fetchContacts(config, params)
      } catch (error) {
        throw new QueryError('Failed to fetch contacts', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false,
  })
}

/**
 * Hook for fetching contact detail
 * @contactId - Contact ID
 * @config - Contact query configuration
 * @options - Contact query options
 */
export function useContactDetail(
  config: ContactQueryConfig,
  contactId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useQuery({
    queryKey: contactQueryKeys.detail(contactId),
    queryFn: async () => {
      try {
        return await fetchContactDetail(contactId, config)
      } catch (error) {
        throw new QueryError('Failed to fetch contact', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!contactId,
  })
}

/**
 * Hook for creating contact
 */
export function useCreateContact(
  config: ContactQueryConfig,
  options?: {
    onSuccess?: (data: ContactType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  if (!config.token) {
    throw new QueryError('Token is required', 'TOKEN_REQUIRED')
  }

  return useMutation({
    mutationFn: async (data: ContactFormData): Promise<ContactType> => {
      return await createContact(config, data)
    },
    onSuccess: (data) => {
      // Invalidate and refetch contacts lists
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.lists() })

      toast.success('Contact created successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create contact', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating contact
 */
export function useUpdateContact(
  config: ContactQueryConfig,
  options?: {
    onSuccess?: (data: ContactType) => void
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
      updateData: ContactFormData
    }): Promise<ContactType> => {
      return await updateContact(id, config, updateData)
    },
    onSuccess: (data) => {
      // Update specific item cache
      queryClient.setQueryData(contactQueryKeys.detail(data.id), data)

      // Invalidate and refetch contacts lists
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.lists() })

      toast.success('Contact updated successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update contact', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting contact
 */
export function useDeleteContact(
  config: ContactQueryConfig,
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
    mutationFn: async (contactId: string): Promise<void> => {
      return await deleteContact(contactId, config)
    },
    onSuccess: (_, contactId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: contactQueryKeys.detail(contactId) })

      // Invalidate and refetch contacts lists
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.lists() })

      toast.success('Contact deleted successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to delete contact', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}
