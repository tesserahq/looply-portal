import {
  createContactInteraction,
  deleteContactInteraction,
  fetchContactInteractionActions,
  fetchContactInteractionDetail,
  fetchContactInteractions,
  fetchContactInteractionsByContactId,
  updateContactInteraction,
} from '@/resources/queries/contact-interactions/contact-interaction.queries'
import {
  ContactInteractionFormData,
  ContactInteractionQueryConfig,
  ContactInteractionQueryParams,
  ContactInteractionType,
} from '@/resources/queries/contact-interactions/contact-interaction.type'
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
 * Contact interaction query keys for React Query Caching
 */
export const contactInteractionQueryKeys = {
  all: ['contact-interactions'] as const,
  lists: () => [...contactInteractionQueryKeys.all, 'list'] as const,
  list: (config: ContactInteractionQueryConfig) =>
    [...contactInteractionQueryKeys.lists(), config] as const,
  byContactLists: () => [...contactInteractionQueryKeys.all, 'by-contact', 'list'] as const,
  byContactList: (
    config: ContactInteractionQueryConfig,
    contactId: string,
    params: ContactInteractionQueryParams
  ) => [...contactInteractionQueryKeys.byContactLists(), config, contactId, params] as const,
  details: () => [...contactInteractionQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactInteractionQueryKeys.details(), id] as const,
  actions: () => [...contactInteractionQueryKeys.all, 'action'] as const,
}

/**
 * Hook for fetching paginated contact interactions
 * @config - Contact interaction query configuration
 * @params - Contact interaction query parameters
 * @options - Contact interaction query options
 */
export function useContactInteractions(
  config: ContactInteractionQueryConfig,
  params: ContactInteractionQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: [...contactInteractionQueryKeys.list(config), params] as const,
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await fetchContactInteractions(config, params)
      } catch (error) {
        throw new QueryError('Failed to fetch contact interactions', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!config.token,
  })
}

/**
 * Hook for fetching paginated contact interactions for a specific contact
 * @config - Contact interaction query configuration
 * @contactId - Contact ID
 * @params - pagination params
 * @options - query options
 */
export function useContactInteractionsByContactId(
  config: ContactInteractionQueryConfig,
  contactId: string,
  params: ContactInteractionQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const isEnabled =
    options?.enabled !== false && Boolean(config.token) && Boolean(contactId) && !!params

  return useQuery({
    queryKey: contactInteractionQueryKeys.byContactList(config, contactId, params),
    queryFn: async () => {
      try {
        return await fetchContactInteractionsByContactId(config, contactId, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch contact interactions for contact',
          'FETCH_ERROR',
          error
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: isEnabled,
  })
}

/**
 * Hook for fetching contact interaction detail
 * @interactionId - Contact interaction ID
 * @config - Contact interaction query configuration
 * @options - Contact interaction query options
 */
export function useContactInteractionDetail(
  config: ContactInteractionQueryConfig,
  interactionId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: contactInteractionQueryKeys.detail(interactionId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await fetchContactInteractionDetail(interactionId, config)
      } catch (error) {
        throw new QueryError('Failed to fetch contact interaction detail', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!config.token && !!interactionId,
  })
}

/**
 * Hook for creating contact interaction
 */
export function useCreateContactInteraction(
  config: ContactInteractionQueryConfig,
  options?: {
    onSuccess?: (data: ContactInteractionType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ContactInteractionFormData): Promise<ContactInteractionType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await createContactInteraction(config, data)
    },
    onSuccess: (data) => {
      // Invalidate and refetch locations lists
      queryClient.invalidateQueries({ queryKey: contactInteractionQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: contactInteractionQueryKeys.byContactLists(),
      })

      toast.success('Contact Interaction created successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create contact interaction', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating contact interaction
 */
export function useUpdateContactInteraction(
  config: ContactInteractionQueryConfig,
  options?: {
    onSuccess?: (data: ContactInteractionType) => void
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
      updateData: Partial<ContactInteractionFormData>
    }): Promise<ContactInteractionType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await updateContactInteraction(config, id, updateData)
    },
    onSuccess: (data) => {
      // Update specific item cache
      queryClient.setQueryData(contactInteractionQueryKeys.detail(data.id), data)

      // Invalidate and refetch locations lists
      queryClient.invalidateQueries({ queryKey: contactInteractionQueryKeys.lists() })

      toast.success('Contact Interaction updated successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update contact interaction', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting contact interaction
 */
export function useDeleteContactInteraction(
  config: ContactInteractionQueryConfig,
  options?: {
    onSuccess?: () => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<ContactInteractionType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await deleteContactInteraction(config, id)
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: contactInteractionQueryKeys.detail(id) })

      // Invalidate and refetch locations lists
      queryClient.invalidateQueries({ queryKey: contactInteractionQueryKeys.lists() })

      toast.success('Contact Interaction deleted successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to delete contact interaction', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for fetching contact interaction actions
 */
export function useContactInteractionActions(
  config: ContactInteractionQueryConfig,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: contactInteractionQueryKeys.actions(),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await fetchContactInteractionActions(config)
      } catch (error) {
        throw new QueryError('Failed to fetch contact interaction actions', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!config.token,
  })
}
