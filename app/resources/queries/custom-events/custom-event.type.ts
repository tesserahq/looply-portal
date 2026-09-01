/**
 * An append-only occurrence ingested from a Linden domain event over NATS, tied to
 * the contact it was resolved against - matches the backend's CustomEvent
 * (app/models/custom_event.py in the looply API). Only recorded for event_types
 * with a registered EventMapping.
 */
export type CustomEventType = {
  id: string
  contact_id: string
  name: string
  occurred_at: string
  properties: Record<string, unknown>
  raw_envelope: Record<string, unknown>
  created_at: string
  updated_at: string
}
