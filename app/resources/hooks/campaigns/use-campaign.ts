import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  getCampaignEngagementTimeline,
  getCampaigns,
  getCampaignStats,
  sendCampaign,
  updateCampaign,
} from '@/resources/queries/campaigns/campaign.queries'
import {
  CampaignType,
  CreateCampaignPayload,
  UpdateCampaignPayload,
} from '@/resources/queries/campaigns/campaign.type'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'tessera-ui/components'

/**
 * Campaign query keys for React Query Caching
 */
export const campaignQueryKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignQueryKeys.all, 'list'] as const,
  list: (config: IQueryConfig, params?: IQueryParams) =>
    [...campaignQueryKeys.lists(), config, params] as const,
  details: () => [...campaignQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignQueryKeys.details(), id] as const,
  stats: (id: string) => [...campaignQueryKeys.detail(id), 'stats'] as const,
  engagementTimeline: (id: string) =>
    [...campaignQueryKeys.detail(id), 'engagement-timeline'] as const,
}

/**
 * Hook for fetching paginated campaigns
 * @config - Campaign query configuration
 * @params - Campaign query parameters
 * @options - Campaign query options
 */
export function useCampaigns(
  config: IQueryConfig,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: campaignQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getCampaigns(config, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch campaigns',
          'FETCH_ERROR',
          error,
          toApiError(error, 'campaigns')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching campaign detail
 * @config - Campaign query configuration
 * @campaignId - Campaign ID
 * @options - Campaign query options
 */
export function useCampaignDetail(
  config: IQueryConfig,
  campaignId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: campaignQueryKeys.detail(campaignId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getCampaign(config, campaignId)
      } catch (error) {
        throw new QueryError('Failed to fetch campaign detail', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!campaignId && !!config.token,
  })
}

/**
 * Hook for fetching a campaign's computed engagement metrics
 * @config - Campaign query configuration
 * @campaignId - Campaign ID
 * @options - Campaign query options
 */
export function useCampaignStats(
  config: IQueryConfig,
  campaignId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: campaignQueryKeys.stats(campaignId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getCampaignStats(config, campaignId)
      } catch (error) {
        throw new QueryError('Failed to fetch campaign stats', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!campaignId && !!config.token,
  })
}

/**
 * Hook for fetching a campaign's engagement timeline (opens/clicks bucketed
 * by time elapsed since send)
 * @config - Campaign query configuration
 * @campaignId - Campaign ID
 * @options - Campaign query options
 */
export function useCampaignEngagementTimeline(
  config: IQueryConfig,
  campaignId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: campaignQueryKeys.engagementTimeline(campaignId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getCampaignEngagementTimeline(config, campaignId)
      } catch (error) {
        throw new QueryError('Failed to fetch campaign engagement timeline', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!campaignId && !!config.token,
  })
}

/**
 * Hook for creating a campaign
 */
export function useCreateCampaign(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: CampaignType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCampaignPayload): Promise<CampaignType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await createCampaign(config, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignQueryKeys.lists() })

      toast.success('Campaign created successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to create campaign', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for updating a campaign
 */
export function useUpdateCampaign(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: CampaignType) => void
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
      updateData: UpdateCampaignPayload
      showSuccessToast?: boolean
    }): Promise<CampaignType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await updateCampaign(config, id, updateData)
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(campaignQueryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: campaignQueryKeys.lists() })

      if (variables.showSuccessToast !== false) {
        toast.success('Campaign updated successfully!')
      }

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to update campaign', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for deleting a campaign
 */
export function useDeleteCampaign(
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
      return await deleteCampaign(config, id)
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: campaignQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: campaignQueryKeys.lists() })

      toast.success('Campaign deleted successfully!')

      options?.onSuccess?.()
    },
    onError: (error: QueryError) => {
      toast.error('Failed to delete campaign', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}

/**
 * Hook for sending a campaign
 */
export function useSendCampaign(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: CampaignType) => void
    onError?: (error: QueryError) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<CampaignType> => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await sendCampaign(config, id)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(campaignQueryKeys.detail(data.id), data)
      // The /send response may not reflect the fully-settled status (e.g. if
      // sending is processed async server-side) — refetch the detail query
      // so the UI reconciles against the authoritative state.
      queryClient.invalidateQueries({ queryKey: campaignQueryKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: campaignQueryKeys.lists() })

      toast.success('Campaign sent successfully!')

      options?.onSuccess?.(data)
    },
    onError: (error: QueryError) => {
      toast.error('Failed to send campaign', {
        description: error?.message || 'Please try again.',
      })

      options?.onError?.(error)
    },
  })
}
