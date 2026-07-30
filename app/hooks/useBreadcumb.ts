/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueries } from '@tanstack/react-query'
import { NodeENVType } from '@/libraries/fetch'
import { BreadcrumbItemData } from 'tessera-ui'
import { fetchContactDetail } from '@/resources/queries/contacts/contact.queries'
import { IQueryConfig } from '@/resources/queries'
import { generateBreadcrumbs } from '@/utils/helpers/breadcrumb'
import { fetchContactListDetail } from '@/resources/queries/contact-lists'
import { fetchWaitingListDetail } from '@/resources/queries/waiting-lists'
import { fetchContactInteractionDetail } from '@/resources/queries/contact-interactions'
import { getCampaign } from '@/resources/queries/campaigns'

/**
 * Resource state per breadcrumb
 */
export type BreadcrumbResourceState<T = any> = {
  data?: T
  isLoading: boolean
  error?: Error | null
}

/**
 * Breadcrumb hook config
 */
interface BreadcrumbConfigType {
  pathname: string
  params: Record<string, string | undefined>
  token: string
  apiUrl: string
  nodeEnv: NodeENVType
}

/**
 * Internal query config
 */
type BreadcrumbQueryConfig = {
  paramKey: string
  queryKey: string[]
  queryFn: () => Promise<any>
  enabled: boolean
  staleTime: number
}

/**
 * Fetcher registry (NO HOOKS)
 */
const breadcrumbFetchers = {
  contact_id: (config: IQueryConfig, id: string) => fetchContactDetail(id, config),
  contact_list_id: (config: IQueryConfig, id: string) => fetchContactListDetail(id, config),
  waiting_list_id: (config: IQueryConfig, id: string) => fetchWaitingListDetail(id, config),
  contact_interaction_id: (config: IQueryConfig, id: string) =>
    fetchContactInteractionDetail(id, config),
  campaign_id: (config: IQueryConfig, id: string) => getCampaign(config, id),
}

export default function useBreadcrumb(config: BreadcrumbConfigType): BreadcrumbItemData[] {
  const { pathname, params, apiUrl, nodeEnv, token } = config

  if (!token) return []

  const pathParts = pathname.split('/').filter(Boolean)

  const queriesConfig = pathParts
    .map((part) => {
      const matched = Object.entries(params).find(([, value]) => value === part)

      if (!matched) return null

      const [paramKey] = matched
      const fetcher = breadcrumbFetchers[paramKey as keyof typeof breadcrumbFetchers]

      if (!fetcher) return null

      return {
        paramKey,
        queryKey: ['breadcrumb', paramKey, part],
        queryFn: () => fetcher({ apiUrl, token, nodeEnv }, part),
        enabled: true,
        staleTime: 5 * 60 * 1000,
      }
    })
    .filter((q): q is BreadcrumbQueryConfig => q !== null)

  const queryResults = useQueries({
    queries: queriesConfig.map(({ paramKey, ...q }) => q),
  })

  /**
   * Build resource map WITH loading state
   */
  const resourceData = queriesConfig.reduce<Record<string, BreadcrumbResourceState>>(
    (acc, config, index) => {
      const result = queryResults[index]

      acc[config.paramKey] = {
        data: result?.data,
        isLoading: result?.isFetching ?? false,
        error: result?.error as Error | null,
      }

      return acc
    },
    {}
  )

  return generateBreadcrumbs({
    pathname,
    params,
    resourceData,
  })
}
