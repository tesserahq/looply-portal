import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import {
  CloneTemplatePayload,
  CreateTemplatePayload,
  TemplateType,
  UpdateTemplatePayload,
} from './template.type'

const TEMPLATES_ENDPOINT = '/templates'

/**
 * List all templates with pagination (Sendly API).
 */
export async function getTemplates(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<TemplateType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}${TEMPLATES_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<TemplateType>
}

/**
 * Get a template by ID (Sendly API).
 */
export async function getTemplate(config: IQueryConfig, id: string): Promise<TemplateType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${TEMPLATES_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'GET',
  })

  return response as TemplateType
}

/**
 * Create a new template (Sendly API).
 */
export async function createTemplate(
  config: IQueryConfig,
  data: CreateTemplatePayload
): Promise<TemplateType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${TEMPLATES_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as TemplateType
}

/**
 * Update a template by ID (Sendly API).
 */
export async function updateTemplate(
  config: IQueryConfig,
  id: string,
  data: UpdateTemplatePayload
): Promise<TemplateType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${TEMPLATES_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

  return response as TemplateType
}

/**
 * Clone template by ID (Sendly API).
 */
export async function cloneTemplate(
  config: IQueryConfig,
  id: string,
  data: CloneTemplatePayload
): Promise<TemplateType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${TEMPLATES_ENDPOINT}/${id}/clone`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as TemplateType
}
