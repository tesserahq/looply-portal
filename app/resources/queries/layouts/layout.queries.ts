import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import { LayoutType } from './layout.type'

const LAYOUTS_ENDPOINT = '/layouts'

/**
 * List all layouts with pagination (Sendly API).
 */
export async function getLayouts(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<LayoutType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}${LAYOUTS_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<LayoutType>
}

/**
 * Get a layout by ID (Sendly API).
 */
export async function getLayout(config: IQueryConfig, id: string): Promise<LayoutType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${LAYOUTS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'GET',
  })

  return response as LayoutType
}
