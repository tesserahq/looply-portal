import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import { CampaignRecipientType } from './campaign-recipient.type'

/**
 * List a campaign's recorded recipients (who it was actually sent to, and
 * their engagement so far), with pagination. Empty for a campaign still in
 * 'draft' status, since recipients are only recorded once the send is
 * accepted.
 */
export async function getCampaignRecipients(
  config: IQueryConfig,
  campaignId: string,
  params: IQueryParams
): Promise<IPaging<CampaignRecipientType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}/campaigns/${campaignId}/recipients`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<CampaignRecipientType>
}
