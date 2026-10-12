import { ApiErrorInfo } from '@/libraries/fetch'
import { RenderResultType } from '@/resources/queries/render/render.type'
import { AppPreloader } from '@/components/loader/pre-loader'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { useRef, useState } from 'react'

/**
 * Stand-ins for the per-recipient fields Sendly merges into the variables at
 * send time (see SendCampaignCommand._to_broadcast_recipient in looply), so
 * a personalized email previews instead of failing on `${first_name}`.
 * Layered over the campaign's variables, as a real send does.
 */
export const SAMPLE_RECIPIENT_VARIABLES = {
  first_name: 'Jane',
  last_name: 'Doe',
  company: 'Acme',
  job_title: 'Head of Marketing',
  contact_type: 'person',
}

interface CampaignPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading: boolean
  result?: RenderResultType
  error?: ApiErrorInfo
}

/**
 * Shows a campaign rendered by Sendly — body inside its layout, variables
 * filled in — or why it couldn't be rendered (a missing variable, a syntax
 * error, a deleted layout), which is exactly what a send would hit.
 */
export function CampaignPreviewDialog({
  open,
  onOpenChange,
  isLoading,
  result,
  error,
}: CampaignPreviewDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState<number>()

  const handleLoad = () => {
    const doc = iframeRef.current?.contentDocument
    if (doc) setHeight(doc.documentElement.scrollHeight)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription>
            Rendered by Sendly with the campaign&apos;s layout and template variables, exactly as it
            will be sent. Recipient fields use sample values (Jane Doe, Acme).
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <AppPreloader className="h-[300px]" />
        ) : error ? (
          <div className="border-destructive/50 rounded-md border p-4">
            <p className="text-destructive font-medium">
              {error.statusCode === 404
                ? 'The selected layout no longer exists. Pick another layout.'
                : "This email can't be rendered yet."}
            </p>
            <p className="text-muted-foreground mt-1 text-sm break-words">{error.message}</p>
          </div>
        ) : result ? (
          <div className="space-y-3">
            <div>
              <span className="text-muted-foreground text-sm">Subject</span>
              <p className="font-medium">{result.subject || '(no subject)'}</p>
            </div>
            <iframe
              ref={iframeRef}
              srcDoc={result.html}
              onLoad={handleLoad}
              className="w-full rounded-md border"
              style={{ height: height ? `${height}px` : '500px' }}
              sandbox="allow-same-origin"
              title="Email preview"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
