import {
  createTemplate,
  getTemplate,
  getTemplates,
  updateTemplate,
} from '@/resources/queries/templates/template.queries'
import {
  CreateTemplatePayload,
  TemplateType,
  UpdateTemplatePayload,
} from '@/resources/queries/templates/template.type'
import { IQueryConfig, IQueryParams } from '@/resources/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'tessera-ui/components'

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
 * Template query keys for React Query Caching
 */
export const templateQueryKeys = {
  all: ['templates'] as const,
  lists: () => [...templateQueryKeys.all, 'list'] as const,
  list: (config: IQueryConfig, params?: IQueryParams) =>
    [...templateQueryKeys.lists(), config, params] as const,
  details: () => [...templateQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateQueryKeys.details(), id] as const,
}

/**
 * Hook for fetching paginated templates (Sendly API)
 * @config - Template query configuration
 * @params - Template query parameters
 * @options - Template query options
 */
export function useTemplates(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: templateQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getTemplates(config, params)
      } catch (error) {
        throw new QueryError('Failed to fetch templates', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!config.token,
  })
}

/**
 * Hook for fetching a template by ID (Sendly API)
 * @config - Template query configuration
 * @templateId - Template ID
 * @options - Template query options
 */
export function useTemplate(
  config: IQueryConfig,
  templateId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: templateQueryKeys.detail(templateId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getTemplate(config, templateId)
      } catch (error) {
        throw new QueryError('Failed to fetch template', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!templateId && !!config.token,
  })
}

/**
 * Hook for creating a template (Sendly API)
 */
export function useCreateTemplate(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: TemplateType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTemplatePayload): Promise<TemplateType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await createTemplate(config, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.lists() })

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create template', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating a template (Sendly API)
 */
export function useUpdateTemplate(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: TemplateType) => void
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
      updateData: UpdateTemplatePayload
    }): Promise<TemplateType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await updateTemplate(config, id, updateData)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(templateQueryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.lists() })

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update template', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}
