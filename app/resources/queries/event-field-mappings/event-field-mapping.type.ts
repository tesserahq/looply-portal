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
 * One non-identity attribute of its parent EventMapping: declares that a value
 * extracted from an ingested event's event_data should be written either onto
 * a built-in Contact column or a contact's custom field, once the parent
 * EventMapping's identity configuration has resolved which contact it belongs
 * to. Matches the backend's EventFieldMapping (app/models/event_field_mapping.py
 * in the looply API). Editable in place - see EventMappingType's docstring
 * (app/resources/queries/event-mappings/event-mapping.type.ts).
 */
export type EventFieldMappingType = {
  id: string
  event_mapping_id: string
  source_path: string
  target_type: EventFieldMappingTargetType
  target_field: string | null
  field_definition_id: string | null
  field_name: string | null
  created_by_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload for creating a new attribute mapping under an EventMapping.
 * event_mapping_id is implied by the URL, not part of this payload.
 */
export type CreateEventFieldMappingPayload = {
  source_path: string
  target_type: EventFieldMappingTargetType
  target_field?: string
  field_name?: string
}

/**
 * Payload for updating an existing attribute mapping in place. All fields
 * optional; only provided fields change.
 */
export type UpdateEventFieldMappingPayload = {
  source_path?: string
  target_type?: EventFieldMappingTargetType
  target_field?: string
  field_name?: string
}
