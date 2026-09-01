import {
  createTag,
  deleteTag,
  getTag,
  getTags,
  getTagUsage,
  updateTag,
} from '@/resources/queries/tags/tag.queries'
import {
  CreateTagPayload,
  TagType,
  TagUsageType,
  TagWithCountsType,
  UpdateTagPayload,
} from '@/resources/queries/tags/tag.type'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'tessera-ui/components'

/**
 * Tag query keys for React Query caching
 */
export const tagQueryKeys = {
  all: ['tags'] as const,
  lists: () => [...tagQueryKeys.all, 'list'] as const,
  list: (config: IQueryConfig, params?: IQueryParams) =>
    [...tagQueryKeys.lists(), config, params] as const,
  details: () => [...tagQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagQueryKeys.details(), id] as const,
  usage: (id: string) => [...tagQueryKeys.all, 'usage', id] as const,
}

/**
 * Hook for fetching paginated tags with usage counts
 */
export function useTags(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: tagQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getTags(config, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch tags',
          'FETCH_ERROR',
          error,
          toApiError(error, 'tags')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching a single tag
 */
export function useTagDetail(
  config: IQueryConfig,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: tagQueryKeys.detail(id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getTag(config, id)
      } catch (error) {
        throw new QueryError('Failed to fetch tag', 'FETCH_ERROR', error, toApiError(error, 'tag'))
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!id && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for creating a tag
 */
export function useCreateTag(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: TagType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTagPayload): Promise<TagType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await createTag(config, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.lists() })

      toast.success(`Tag "${data.name}" created successfully!`)

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create tag', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for renaming a tag
 */
export function useUpdateTag(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: TagType) => void
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
      updateData: UpdateTagPayload
    }): Promise<TagType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await updateTag(config, id, updateData)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(tagQueryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.lists() })

      toast.success(`Tag renamed to "${data.name}"!`)

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to rename tag', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting a tag
 */
export function useDeleteTag(
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
      return await deleteTag(config, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.lists() })

      toast.success('Tag deleted successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to delete tag', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Fetches a tag's delete impact on demand (not a useQuery hook - called
 * imperatively when the delete-confirm dialog opens, so browsing the list
 * never triggers a segment scan).
 */
export function fetchTagUsage(config: IQueryConfig, id: string): Promise<TagUsageType> {
  if (!config.token) {
    return Promise.reject(new QueryError('Token is required', 'TOKEN_REQUIRED'))
  }
  return getTagUsage(config, id)
}

export type { TagWithCountsType }
