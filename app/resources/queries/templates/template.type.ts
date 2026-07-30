/**
 * Template Type (Sendly)
 */
export type TemplateType = {
  id: string
  alias: string
  name: string
  subject: string
  html: string
  from_email: string | null
  reply_to: string | null
  layout_id: string | null
  layout?: {
    id: string
    alias: string
    name: string | null
    html: string
  }
  created_at: string
  updated_at: string
}

export type CreateTemplatePayload = {
  alias: string
  name: string
  subject: string
  html: string
  from_email?: string
  reply_to?: string
  layout_id?: string
}

export type UpdateTemplatePayload = {
  alias?: string
  name?: string
  subject?: string
  html?: string
  from_email?: string | null
  reply_to?: string | null
  layout_id?: string | null
}
