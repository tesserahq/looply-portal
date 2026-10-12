import { renderContent } from '@/resources/queries/render/render.queries'
import { RenderPayload, RenderResultType } from '@/resources/queries/render/render.type'
import { IQueryConfig, QueryError } from '@/resources/queries'
import { toApiError } from '@/libraries/fetch'
import { useMutation } from '@tanstack/react-query'

/**
 * Hook for rendering a campaign preview (Sendly API). A mutation rather than
 * a query because it's triggered on demand with the editor's current
 * content. No toasts: a failed render (e.g. a missing variable) is the
 * preview's content, shown inline via `apiError`.
 */
export function useRenderContent(config: IQueryConfig) {
  const mutation = useMutation({
    mutationFn: async (payload: RenderPayload): Promise<RenderResultType> => {
      try {
        if (!config.token) {
          throw new QueryError('Token is required', 'TOKEN_REQUIRED')
        }
        return await renderContent(config, payload)
      } catch (error) {
        throw new QueryError(
          'Failed to render preview',
          'RENDER_ERROR',
          error,
          toApiError(error, 'sendly email layout')
        )
      }
    },
  })

  return { ...mutation, apiError: (mutation.error as QueryError | null)?.apiError }
}
