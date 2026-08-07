import { useMutation } from '@tanstack/react-query'
import { IAssetInput, IAssetResponse, uploadAssets } from '@/resources/queries/vaulta'
import { toast } from 'tessera-ui/components'
import { IQueryConfig, QueryError } from '@/resources/queries'

/**
 * Hook for uploading an asset (Vaulta API)
 */
export function useUploadAsset(
  config: IQueryConfig,
  options?: {
    onSuccess?: (data: IAssetResponse | null) => void
    onError?: (error: Error) => void
  }
) {
  return useMutation({
    mutationFn: async (body: IAssetInput) => {
      if (!config.token) {
        throw new QueryError('Token is required', 'TOKEN_REQUIRED')
      }
      return await uploadAssets(config, body)
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast.error('Failed to upload image', {
        description: error?.message || 'Please try again.',
      })
      options?.onError?.(error)
    },
  })
}
