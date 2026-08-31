/**
 * Declares that an ingested NATS event of a given event_type should have a value
 * extracted from its event_data and written onto a contact's custom field - matches
 * the backend's EventFieldMapping (app/models/event_field_mapping.py in the looply
 * API). Only takes effect once/if event_type is also registered as a
 * TrackedEventType.
 */
export type EventFieldMappingType = {
  id: string
  event_type: string
  source_path: string
  field_definition_id: string
  field_name: string
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
  field_name: string
}
