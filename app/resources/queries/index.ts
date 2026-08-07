import { ApiErrorInfo, NodeENVType } from '@/libraries/fetch'

/**
 * Required configuration for API queries (apiUrl, token, nodeEnv)
 */
export interface IQueryConfig {
  apiUrl: string
  token: string
  nodeEnv: NodeENVType
}

/**
 * Query parameters for pagination
 */
export interface IQueryParams {
  page?: number
  size?: number
  q?: string
}

/**
 * Shared error type for React Query `queryFn`/`mutationFn` failures across
 * resource hooks. `apiError` is populated via `toApiError()` when a hook
 * wants to surface a parsed, UI-ready error (see use-template.ts).
 */
export class QueryError extends Error {
  code?: string
  details?: unknown
  apiError?: ApiErrorInfo

  constructor(message: string, code?: string, details?: unknown, apiError?: ApiErrorInfo) {
    super(message)
    this.name = 'QueryError'
    this.code = code
    this.details = details
    this.apiError = apiError
  }
}
