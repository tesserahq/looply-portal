/**
 * Broadcast Type (Sendly)
 */
export type BroadcastType = {
  batch_id: string
  project_id: string | null
  queued_count: number
  suppressed_count: number
  created_at: string
}
