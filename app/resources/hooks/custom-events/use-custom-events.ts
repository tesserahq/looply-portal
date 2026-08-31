import {
  getContactCustomEvents,
  getCustomEvent,
  getCustomEvents,
} from '@/resources/queries/custom-events/custom-event.queries'
import { IQueryConfig, IQueryParams, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useQuery } from '@tanstack/react-query'

/**
 * Custom event query keys for React Query caching
 */
export const customEventQueryKeys = {
  all: ['custom-events'] as const,
  lists: () => [...customEventQueryKeys.all, 'list'] as const,
  list: (config: IQueryConfig, params?: unknown) =>
    [...customEventQueryKeys.lists(), config, params] as const,
  details: () => [...customEventQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...customEventQueryKeys.details(), id] as const,
  contactList: (contactExternalId: string) =>
    [...customEventQueryKeys.all, 'contact-list', contactExternalId] as const,
}

/**
 * Hook for fetching paginated custom events - optionally filtered by name and/or
 * contact_id. Global (not contact-scoped) view.
 */
export function useCustomEvents(
  config: IQueryConfig,
  params: IQueryParams & { name?: string; contact_id?: string },
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: customEventQueryKeys.list(config, params),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getCustomEvents(config, params)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch custom events',
          'FETCH_ERROR',
          error,
          toApiError(error, 'custom events')
        )
      }
    },
    staleTime: options?.staleTime ?? 30 * 1000,
    enabled: options?.enabled !== false && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching a single custom event
 */
export function useCustomEventDetail(
  config: IQueryConfig,
  id: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: customEventQueryKeys.detail(id),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getCustomEvent(config, id)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch custom event',
          'FETCH_ERROR',
          error,
          toApiError(error, 'custom event')
        )
      }
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    enabled: options?.enabled !== false && !!id && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}

/**
 * Hook for fetching a contact's custom event history (user story 11)
 */
export function useContactCustomEvents(
  config: IQueryConfig,
  contactExternalId: string,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  const query = useQuery({
    queryKey: customEventQueryKeys.contactList(contactExternalId),
    queryFn: async () => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }

        return await getContactCustomEvents(config, contactExternalId)
      } catch (error) {
        throw new QueryError(
          'Failed to fetch custom events',
          'FETCH_ERROR',
          error,
          toApiError(error, 'custom events')
        )
      }
    },
    staleTime: options?.staleTime ?? 0,
    enabled: options?.enabled !== false && !!contactExternalId && !!config.token,
  })

  return { ...query, apiError: (query.error as QueryError | null)?.apiError }
}
