import { IAssetInput, IAssetResponse } from './vaulta.type'
import { IQueryConfig } from '..'

/**
 * Upload an asset (Vaulta API). Uses a raw multipart `fetch` rather than
 * `fetchApi` since the body is `FormData`, not JSON.
 */
export async function uploadAssets(
  config: IQueryConfig,
  body: IAssetInput
): Promise<IAssetResponse | null> {
  const { apiUrl, token } = config

  const payload = new FormData()
  if (body.name) payload.set('name', body.name)
  if (body.labels) payload.set('labels', body.labels)
  if (body.extract_data !== undefined) payload.set('extract_data', String(body.extract_data))
  if (body.summarize !== undefined) payload.set('summarize', String(body.summarize))
  if (body.expires_in !== undefined) payload.set('expires_in', String(body.expires_in))
  payload.set('file', body.file)

  const response = await fetch(`${apiUrl}/assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  })

  if (!response.ok) return null

  const data: IAssetResponse = await response.json()

  return data
}

/**
 * Public, long-lived URL for an uploaded asset, suitable for embedding in
 * emails. Prefer this over `asset.url`: that is a raw S3 presigned URL whose
 * lifetime is capped by the signing credentials (and AWS's 7-day limit), so
 * images break in emails once it expires. When the upload passed
 * `expires_in`, Vaulta returns a signed, relative `/assets/serve/...` path
 * that it serves for that full duration; otherwise `serve_url` is already
 * absolute.
 */
export function getAssetServeUrl(apiUrl: string, asset: Pick<IAssetResponse, 'serve_url'>) {
  if (/^https?:\/\//.test(asset.serve_url)) return asset.serve_url
  return `${apiUrl.replace(/\/+$/, '')}${asset.serve_url}`
}
