import {
  createSegment,
  deleteSegment,
  getSegment,
  getSegments,
  previewSegment,
  previewSegmentById,
  updateSegment,
} from '@/resources/queries/segments/segment.queries'
import {
  CreateSegmentPayload,
  SegmentRule,
  SegmentType,
  UpdateSegmentPayload,
} from '@/resources/queries/segments/segment.type'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'tessera-ui/components'

/**
 * Segment query keys for React Query Caching
 */
export const segmentQueryKeys = {
  all: ['segments'] as const,
  lists: () => [...segmentQueryKeys.all, 'list'] as const,
  list: (config: IQueryConfig, params?: IQueryParams) =>
    [...segmentQueryKeys.lists(), config, params] as const,
  details: () => [...segmentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...segmentQueryKeys.details(), id] as const,
  previews: () => [...segmentQueryKeys.all, 'preview'] as const,
  preview: (id: string) => [...segmentQueryKeys.previews(), id] as const,
}

/**
 * Hook for fetching paginated segments
 */
export function useSegments(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: segmentQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getSegments(config, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch segments',
          'FETCH_ERROR',
          error,
          toApiError(error, 'segments')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching segment detail
 */
export function useSegmentDetail(
  config: IQueryConfig,
  segmentId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: segmentQueryKeys.detail(segmentId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getSegment(config, segmentId)
      } catch (error) {
        throw new QueryError('Failed to fetch segment detail', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!segmentId && !!config.token,
  })
}

/**
 * Hook for fetching a saved segment's live, non-persisted contact count.
 */
export function useSegmentPreviewById(
  config: IQueryConfig,
  segmentId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: segmentQueryKeys.preview(segmentId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await previewSegmentById(config, segmentId)
      } catch (error) {
        throw new QueryError('Failed to preview segment', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime ?? 0,
    enabled: options?.enabled !== false && !!segmentId && !!config.token,
  })
}

/**
 * Hook for previewing a draft rule tree that hasn't been saved as a segment
 * yet - lets a form show a live count while the segment is still being built.
 */
export function useSegmentPreview(
  config: IQueryConfig,
  options?: {
    onError?: (error: QueryError) => void
  }
) {
  return useMutation({
    mutationFn: async (rule: SegmentRule) => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await previewSegment(config, rule)
    },
    onError: (error: QueryError) => {
      options?.onError?.(error)
    },
  })
}

/**
 * Hook for creating a segment
 */
export function useCreateSegment(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: SegmentType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSegmentPayload): Promise<SegmentType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await createSegment(config, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: segmentQueryKeys.lists() })

      toast.success('Segment created successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create segment', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating a segment
 */
export function useUpdateSegment(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: SegmentType) => void
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
      updateData: UpdateSegmentPayload
    }): Promise<SegmentType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await updateSegment(config, id, updateData)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(segmentQueryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: segmentQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: segmentQueryKeys.preview(data.id) })

      toast.success('Segment updated successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update segment', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting a segment
 */
export function useDeleteSegment(
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
      return await deleteSegment(config, id)
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: segmentQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: segmentQueryKeys.lists() })

      toast.success('Segment deleted successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to delete segment', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}
