import { getCampaignRecipients } from '@/resources/queries/campaigns/campaign-recipient.queries'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { useQuery } from '@tanstack/react-query'

export const campaignRecipientQueryKeys = {
  all: ['campaign-recipients'] as const,
  lists: () => [...campaignRecipientQueryKeys.all, 'list'] as const,
  listForCampaign: (campaignId: string, params: IQueryParams) =>
    [...campaignRecipientQueryKeys.lists(), campaignId, params] as const,
}

/**
 * Hook for fetching a campaign's paginated, recorded recipients.
 */
export function useCampaignRecipients(
  config: IQueryConfig,
  campaignId: string,
  params: IQueryParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: campaignRecipientQueryKeys.listForCampaign(campaignId, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getCampaignRecipients(config, campaignId, params)
      } catch (error) {
        throw new QueryError('Failed to fetch campaign recipients', 'FETCH_ERROR', error)
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && !!campaignId && !!config.token,
  })
}
