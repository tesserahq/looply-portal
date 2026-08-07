/* eslint-disable @typescript-eslint/no-explicit-any */
import { CurlGenerator } from 'curl-generator'

export type NodeENVType = 'test' | 'development' | 'staging' | 'production'

export interface ApiErrorInfo {
  statusCode: number
  // The literal text the API returned (e.g. "Access denied") — use this to
  // say what actually happened.
  rawMessage: string
  // Friendlier, contextual version — generic denials get rewritten to name
  // the resource (see GENERIC_403_MESSAGES below); specific ones pass through
  // unchanged and end up identical to `rawMessage`.
  message: string
}

// Custom error class for token expiration
export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TokenExpiredError'
  }
}

// Custom error class for unauthorized access
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

// Backend 403 messages that don't actually say what was denied — when we see
// one of these, we substitute a message naming the resource instead of
// surfacing the vague text verbatim.
const GENERIC_403_MESSAGES = new Set([
  'access denied',
  'forbidden',
  'unauthorized',
  'unauthorized access',
  'permission denied',
])

// Converts a fetchApi error (message is a JSON-stringified `{status, error}`,
// see the `throw`s below) into a plain `{statusCode, message}` shape UI
// components can render directly. `context` names the API/resource being
// called (e.g. "the Sendly API") and is only used to fill in generic 403
// messages that otherwise wouldn't tell the user what they lack access to.
export function toApiError(error: unknown, context?: string): ApiErrorInfo {
  const message = error instanceof Error ? error.message : String(error)

  try {
    const parsed = JSON.parse(message)
    const rawDetail = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error)
    const statusCode = typeof parsed.status === 'number' ? parsed.status : 500
    const isGenericDenial = GENERIC_403_MESSAGES.has((rawDetail ?? '').trim().toLowerCase())

    const fallbackMessage = rawDetail || 'An unexpected error occurred'

    return {
      statusCode,
      rawMessage: fallbackMessage,
      message: isGenericDenial
        ? `You don't have access to ${context ?? 'this resource'}. Please contact your administrator.`
        : fallbackMessage,
    }
  } catch {
    const fallbackMessage = message || 'An unexpected error occurred'
    return { statusCode: 500, rawMessage: fallbackMessage, message: fallbackMessage }
  }
}

export type ApiQueryParams = Record<string, string | number | boolean | undefined>

export type ApiOptions = RequestInit & {
  params?: ApiQueryParams
  pagination?: { page?: number; size?: number }
}

export const fetchApi = async (
  endpoint: string,
  token: string,
  node_env: NodeENVType,
  options: ApiOptions = {}
) => {
  const headers: any = { 'Content-Type': 'application/json' }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const { params, pagination, ...restOptions } = options

  let url = endpoint

  // Append query params and optional pagination
  if (params || pagination) {
    const urlObj = new URL(endpoint, 'http://dummy-base')
    // If endpoint is absolute, base won't be used. If relative, we strip it later.

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined) return
        urlObj.searchParams.set(key, String(value))
      })
    }

    if (pagination) {
      if (pagination.page !== undefined) {
        urlObj.searchParams.set('page', String(pagination.page))
      }
      if (pagination.size !== undefined) {
        urlObj.searchParams.set('size', String(pagination.size))
      }
    }

    // Reconstruct preserving relative/absolute form
    const search = urlObj.search ? urlObj.search : ''
    const pathname = endpoint.startsWith('http') ? urlObj.toString() : `${urlObj.pathname}${search}`
    url = endpoint.startsWith('http') ? urlObj.toString() : pathname
  }

  const config = {
    ...restOptions,
    headers: {
      ...headers,
      ...restOptions.headers,
    },
  }

  if (node_env === 'development') {
    const params: any = {
      url,
      method: options.method || 'GET',
      ...config,
    }

    const curlSnippet = CurlGenerator(params)

    console.log(curlSnippet)
  }

  const response = await fetch(`${url}`, config)

  // for anticipation error json.parse if response status is 204
  if (response.status === 204) {
    return { message: response.statusText }
  }

  const json = await response.json()

  if (response.status >= 400) {
    // Handle token expiration (401) and unauthorized access (403)
    if (response.status === 401) {
      throw new TokenExpiredError(
        JSON.stringify({
          status: response.status,
          error: json?.detail ? json.detail : json?.detail?.[0]?.msg || 'Token expired or invalid',
        })
      )
    }

    if (response.status === 403) {
      throw new UnauthorizedError(
        JSON.stringify({
          status: response.status,
          error: json?.detail ? json.detail : json?.detail?.[0]?.msg || 'Unauthorized access',
        })
      )
    }

    throw new Error(
      JSON.stringify({
        status: response.status,
        error: json?.detail
          ? json.detail
            ? json.detail
            : json?.detail[0]?.msg
          : response.statusText,
      })
    )
  }

  return json
}
