import {
  createCustomFieldDefinition,
  deleteContactCustomFieldValue,
  deleteCustomFieldDefinition,
  getContactCustomFieldValues,
  getCustomFieldDefinition,
  getCustomFieldDefinitions,
  setContactCustomFieldValue,
  updateCustomFieldDefinition,
} from '@/resources/queries/custom-fields/custom-field.queries'
import {
  ContactCustomFieldValueType,
  CreateCustomFieldDefinitionPayload,
  CustomFieldDefinitionType,
  UpdateCustomFieldDefinitionPayload,
} from '@/resources/queries/custom-fields/custom-field.type'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'tessera-ui/components'

/**
 * Custom field query keys for React Query caching
 */
export const customFieldQueryKeys = {
  definitions: {
    all: ['custom-field-definitions'] as const,
    lists: () => [...customFieldQueryKeys.definitions.all, 'list'] as const,
    list: (config: IQueryConfig, params?: IQueryParams) =>
      [...customFieldQueryKeys.definitions.lists(), config, params] as const,
    details: () => [...customFieldQueryKeys.definitions.all, 'detail'] as const,
    detail: (id: string) => [...customFieldQueryKeys.definitions.details(), id] as const,
  },
  contactValues: {
    all: ['contact-custom-field-values'] as const,
    list: (contactExternalId: string) =>
      [...customFieldQueryKeys.contactValues.all, contactExternalId] as const,
  },
}

/**
 * Hook for fetching paginated custom field definitions
 */
export function useCustomFieldDefinitions(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: customFieldQueryKeys.definitions.list(config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getCustomFieldDefinitions(config, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch custom field definitions',
          'FETCH_ERROR',
          error,
          toApiError(error, 'custom field definitions')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching a single custom field definition
 */
export function useCustomFieldDefinitionDetail(
  config: IQueryConfig,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: customFieldQueryKeys.definitions.detail(id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getCustomFieldDefinition(config, id)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch custom field definition',
          'FETCH_ERROR',
          error,
          toApiError(error, 'custom field definition')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!id && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for creating a custom field definition
 */
export function useCreateCustomFieldDefinition(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: CustomFieldDefinitionType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      data: CreateCustomFieldDefinitionPayload
    ): Promise<CustomFieldDefinitionType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await createCustomFieldDefinition(config, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customFieldQueryKeys.definitions.lists() })

      toast.success(`Custom field "${data.name}" created successfully!`)

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create custom field', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating a custom field definition's label
 */
export function useUpdateCustomFieldDefinition(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: CustomFieldDefinitionType) => void
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
      updateData: UpdateCustomFieldDefinitionPayload
    }): Promise<CustomFieldDefinitionType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await updateCustomFieldDefinition(config, id, updateData)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(customFieldQueryKeys.definitions.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: customFieldQueryKeys.definitions.lists() })

      toast.success(`Custom field "${data.name}" updated successfully!`)

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update custom field', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting a custom field definition
 */
export function useDeleteCustomFieldDefinition(
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
      return await deleteCustomFieldDefinition(config, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldQueryKeys.definitions.lists() })

      toast.success('Custom field deleted successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to delete custom field', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for fetching a contact's current custom field values
 */
export function useContactCustomFieldValues(
  config: IQueryConfig,
  contactExternalId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: customFieldQueryKeys.contactValues.list(contactExternalId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getContactCustomFieldValues(config, contactExternalId)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch custom field values',
          'FETCH_ERROR',
          error,
          toApiError(error, 'custom field values')
        )
      }
    },
    staleTime: options?.staleTime ?? 0,
    enabled: options?.enabled !== false && !!contactExternalId && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for setting (upserting) a contact's value for a named field
 */
export function useSetContactCustomFieldValue(
  config: IQueryConfig,
  contactExternalId: string,
  options?: {
    onSuccess?: (data: ContactCustomFieldValueType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fieldName,
      value,
    }: {
      fieldName: string
      value: string | number | boolean
    }): Promise<ContactCustomFieldValueType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await setContactCustomFieldValue(config, contactExternalId, fieldName, value)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: customFieldQueryKeys.contactValues.list(contactExternalId),
      })

      toast.success(`"${data.field_name}" saved successfully!`)

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to save custom field value', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting a contact's value for a named field
 */
export function useDeleteContactCustomFieldValue(
  config: IQueryConfig,
  contactExternalId: string,
  options?: {
    onSuccess?: () => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fieldName: string): Promise<void> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await deleteContactCustomFieldValue(config, contactExternalId, fieldName)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: customFieldQueryKeys.contactValues.list(contactExternalId),
      })

      toast.success('Custom field value deleted successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to delete custom field value', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}
