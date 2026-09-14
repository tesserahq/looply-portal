import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import { ContactType } from '@/resources/queries/contacts/contact.type'
import {
  CreateSegmentPayload,
  SegmentPreviewResponse,
  SegmentRule,
  SegmentType,
  UpdateSegmentPayload,
} from './segment.type'

const SEGMENTS_ENDPOINT = '/segments'

/**
 * List all segments with pagination.
 */
export async function getSegments(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<SegmentType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}${SEGMENTS_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<SegmentType>
}

/**
 * Get a segment by ID.
 */
export async function getSegment(config: IQueryConfig, id: string): Promise<SegmentType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${SEGMENTS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'GET',
  })

  return response as SegmentType
}

/**
 * Create a new segment.
 */
export async function createSegment(
  config: IQueryConfig,
  data: CreateSegmentPayload
): Promise<SegmentType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${SEGMENTS_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as SegmentType
}

/**
 * Update a segment by ID.
 */
export async function updateSegment(
  config: IQueryConfig,
  id: string,
  data: UpdateSegmentPayload
): Promise<SegmentType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${SEGMENTS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  return response as SegmentType
}

/**
 * Delete a segment by ID.
 */
export async function deleteSegment(config: IQueryConfig, id: string): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${SEGMENTS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}

/**
 * Paginated list of contacts currently matching a saved segment.
 */
export async function getSegmentContacts(
  config: IQueryConfig,
  segmentId: string,
  params: IQueryParams
): Promise<IPaging<ContactType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(
    `${apiUrl}${SEGMENTS_ENDPOINT}/${segmentId}/contacts`,
    token,
    nodeEnv,
    {
      method: 'GET',
      pagination: { page, size },
    }
  )

  return response as IPaging<ContactType>
}

/**
 * Live, non-persisted contact count for a saved segment.
 */
export async function previewSegmentById(
  config: IQueryConfig,
  id: string
): Promise<SegmentPreviewResponse> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${SEGMENTS_ENDPOINT}/${id}/preview`, token, nodeEnv, {
    method: 'GET',
  })

  return response as SegmentPreviewResponse
}

/**
 * Live, non-persisted contact count for a rule tree not yet saved as a segment.
 */
export async function previewSegment(
  config: IQueryConfig,
  rule: SegmentRule
): Promise<SegmentPreviewResponse> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${SEGMENTS_ENDPOINT}/preview`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(rule),
  })

  return response as SegmentPreviewResponse
}
