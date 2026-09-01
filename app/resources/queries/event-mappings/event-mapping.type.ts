/**
 * The only Contact columns with a uniqueness guarantee - the only valid targets
 * for an EventMapping's identity configuration. Mirrors the backend's
 * IDENTITY_KEY_TARGETS (app/models/event_mapping.py in the looply API).
 */
export const IDENTITY_KEY_TARGETS = ['external_id', 'email'] as const

/**
 * Registers an event_type for Looply to act on: which payload path + Contact
 * column identifies the contact for that event_type (identity_target_field /
 * identity_source_path), and what provenance to stamp on a contact
 * auto-created from it (source). Its EventFieldMapping children each declare
 * one additional attribute to fill in once the contact is resolved. Matches
 * the backend's EventMapping (app/models/event_mapping.py in the looply API) -
 * replaces the old, separate TrackedEventType allow-list.
 *
 * Unlike before, both this row's identity configuration and its
 * EventFieldMapping children are editable in place, not delete-and-recreate.
 */
export type EventMappingType = {
  id: string
  event_type: string
  source: string | null
  identity_target_field: string | null
  identity_source_path: string | null
  /** Lifecycle status stamped onto a contact auto-created from this event_type.
   * One of the values from GET /contacts/contact-statuses. Only applied on
   * creation - never touches an existing contact matched by a later event. */
  default_status: string | null
  /** Tag names stamped onto a contact auto-created from this event_type.
   * Only applied on creation - never touches an existing contact matched by a
   * later event. */
  default_tags: string[]
  created_by_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload for registering a new event_type. identity_target_field and
 * identity_source_path must be set together, or omitted together - an
 * EventMapping can exist with no identity configured yet, but every event for
 * it is dropped until identity is set (here or via a later update).
 */
export type CreateEventMappingPayload = {
  event_type: string
  source?: string
  identity_target_field?: string
  identity_source_path?: string
  default_status?: string
  default_tags?: string[]
}

/**
 * Payload for updating an existing EventMapping's source/identity
 * configuration in place. All fields optional; only provided fields change.
 */
export type UpdateEventMappingPayload = {
  source?: string
  identity_target_field?: string
  identity_source_path?: string
  default_status?: string
  default_tags?: string[]
}
