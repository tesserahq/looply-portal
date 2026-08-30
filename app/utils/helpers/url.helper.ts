/**
 * Builds an absolute URL against an external host, substituting `:param` placeholders in `path`
 * with values from `params`.
 * e.g. buildResourceUrl(sendlyHostUrl, '/broadcasts/:id/overview', { id: batchId })
 */
export function buildResourceUrl(
  hostUrl: string,
  path: string,
  params: Record<string, string> = {}
): string {
  const resolvedPath = Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, encodeURIComponent(value)),
    path
  )
  return new URL(resolvedPath, hostUrl).toString()
}
