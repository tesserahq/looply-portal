import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import {
  CreateTagPayload,
  TagType,
  TagUsageType,
  TagWithCountsType,
  UpdateTagPayload,
} from './tag.type'

const TAGS_ENDPOINT = '/tags'

/**
 * List all active tags with pagination, including usage counts.
 */
export async function getTags(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<TagWithCountsType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}${TAGS_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<TagWithCountsType>
}

/**
 * Get a tag by ID.
 */
export async function getTag(config: IQueryConfig, id: string): Promise<TagType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${TAGS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'GET',
  })

  return response as TagType
}

/**
 * A tag's delete impact - assignment counts plus any segments referencing
 * it. Fetched only when the delete-confirm dialog opens.
 */
export async function getTagUsage(config: IQueryConfig, id: string): Promise<TagUsageType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${TAGS_ENDPOINT}/${id}/usage`, token, nodeEnv, {
    method: 'GET',
  })

  return response as TagUsageType
}

/**
 * Create a new tag.
 */
export async function createTag(config: IQueryConfig, data: CreateTagPayload): Promise<TagType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${TAGS_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as TagType
}

/**
 * Rename an existing tag.
 */
export async function updateTag(
  config: IQueryConfig,
  id: string,
  data: UpdateTagPayload
): Promise<TagType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${TAGS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  return response as TagType
}

/**
 * Delete a tag by ID, removing it from every contact/campaign it's assigned
 * to.
 */
export async function deleteTag(config: IQueryConfig, id: string): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${TAGS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}
