import EmptyContent from '@/components/empty-content/empty-content'

interface ApiErrorOverlayProps {
  statusCode: number
  message: string
  // The literal text the API returned (e.g. "Access denied"). Falls back to
  // `message` when not provided.
  rawMessage?: string
}

// Replaces the panel it's rendered in place of, to show why that specific
// section failed to load, instead of leaving it blank.
export function ApiErrorOverlay({ message, rawMessage, statusCode }: ApiErrorOverlayProps) {
  return (
    <EmptyContent
      image="/images/403.png"
      title={`${statusCode} ${rawMessage}`}
      description={message}
    />
  )
}
