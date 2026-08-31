/**
 * Whether a mapping writes onto a built-in Contact column or a custom field -
 * matches the backend's EventFieldMappingTargetType
 * (app/schemas/event_field_mapping.py in the looply API).
 */
export type EventFieldMappingTargetType = 'contact_field' | 'custom_field'

/**
 * Real, settable Contact columns a "contact_field" mapping can target - mirrors
 * the backend's CONTACT_FIELD_TARGETS (app/models/event_field_mapping.py).
 */
export const CONTACT_FIELD_TARGETS = [
  'external_id',
  'first_name',
  'middle_name',
  'last_name',
  'company',
  'job',
  'phone',
  'email',
  'website',
  'address_line_1',
  'address_line_2',
  'city',
  'state',
  'zip_code',
  'country',
  'notes',
] as const

/**
 * The only Contact columns with a uniqueness guarantee - the only valid targets
 * for is_identity_key mappings. Mirrors the backend's IDENTITY_KEY_TARGETS.
 */
export const IDENTITY_KEY_TARGETS = ['external_id', 'email'] as const

/**
 * Declares that an ingested NATS event of a given event_type should have a value
 * extracted from its event_data and written either onto a built-in Contact
 * column or a contact's custom field - matches the backend's EventFieldMapping
 * (app/models/event_field_mapping.py in the looply API). Only takes effect
 * once/if event_type is also registered as a TrackedEventType.
 *
 * Exactly one mapping per event_type may have is_identity_key=true - it names
 * the payload path and Contact column (external_id or email) used to
 * resolve/auto-create the Contact for that event_type.
 */
export type EventFieldMappingType = {
  id: string
  event_type: string
  source_path: string
  target_type: EventFieldMappingTargetType
  target_field: string | null
  field_definition_id: string | null
  field_name: string | null
  is_identity_key: boolean
  created_by_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload for creating a new event-to-field mapping. Immutable once set - there
 * is no update payload; delete and recreate to change it.
 */
export type CreateEventFieldMappingPayload = {
  event_type: string
  source_path: string
  target_type: EventFieldMappingTargetType
  target_field?: string
  field_name?: string
  is_identity_key: boolean
}
