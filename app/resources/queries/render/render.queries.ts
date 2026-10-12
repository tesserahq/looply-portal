import { fetchApi } from '@/libraries/fetch'
import { IQueryConfig } from '..'
import { RenderPayload, RenderResultType } from './render.type'

const RENDER_ENDPOINT = '/render'

/**
 * Render content for preview (Sendly API). Side-effect free; goes through the
 * same rendering path as a real send, so the preview matches what is sent.
 */
export async function renderContent(
  config: IQueryConfig,
  payload: RenderPayload
): Promise<RenderResultType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${RENDER_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response as RenderResultType
}
