/**
 * The allow-list of event_types Looply actually acts on out of everything it
 * receives on the shared NATS stream - matches the backend's TrackedEventType
 * (app/models/tracked_event_type.py in the looply API).
 */
export type TrackedEventTypeType = {
  id: string
  event_type: string
  created_by_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload for registering a new event_type to track. Immutable once set - there
 * is no update payload; delete and recreate to change it.
 */
export type CreateTrackedEventTypePayload = {
  event_type: string
}
