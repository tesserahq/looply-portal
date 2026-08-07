import { TokenExpiredError } from '@/libraries/fetch'
import { useNavigate } from 'react-router'
import { useCallback } from 'react'
import { toast } from 'tessera-ui/components'

// Handles the one case that's actually global: an invalid session (401)
// redirects everywhere, regardless of which API call triggered it. 403s are
// NOT handled here — the right response depends on which part of the UI
// failed (an overlay on the affected panel, inline text on a small control,
// or a toast for a one-off action), so those are handled where the error
// occurs instead of through a single blanket handler.
export const useHandleApiError = () => {
  const navigate = useNavigate()

  const handleApiError = useCallback(
    (error: unknown) => {
      if (error instanceof TokenExpiredError) {
        toast.error('Session expired. Please log in again.')
        navigate('/logout', { replace: true })
        return true
      }

      return false
    },
    [navigate]
  )

  return handleApiError
}
