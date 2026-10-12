/**
 * Content to preview, rendered by Sendly exactly as an inline send renders it.
 */
export type RenderPayload = {
  html: string
  subject?: string
  layout_id?: string
  template_variables?: Record<string, unknown>
}

export type RenderResultType = {
  /** The body, wrapped in the layout when one was given. */
  html: string
  subject: string
}
