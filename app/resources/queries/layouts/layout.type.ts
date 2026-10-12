/**
 * Layout Type (Sendly). A layout wraps a campaign's body, which is passed to
 * it as `${content}` when Sendly renders the email.
 */
export type LayoutType = {
  id: string
  alias: string
  name: string | null
  html: string
  created_at: string
  updated_at: string
}
