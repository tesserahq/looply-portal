/**
 * Fixed set of value types a CustomFieldDefinition can declare - mirrors the
 * backend's FieldValueType (app/schemas/custom_field_definition.py in the looply API).
 * Required at creation, never inferred from a value; immutable once set.
 */
export type FieldValueType = 'string' | 'number' | 'boolean' | 'date'

export type CustomFieldDefinitionType = {
  id: string
  name: string
  value_type: FieldValueType
  label: string | null
  created_by_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload for creating a custom field definition. name and value_type are
 * immutable once set - there is no update payload.
 */
export type CreateCustomFieldDefinitionPayload = {
  name: string
  value_type: FieldValueType
  label?: string
}

/**
 * Payload for updating a custom field definition. name and value_type are
 * immutable once set - only label can be changed after creation.
 */
export type UpdateCustomFieldDefinitionPayload = {
  label?: string
}

/**
 * A contact's current value for one custom field definition.
 */
export type ContactCustomFieldValueType = {
  id: string
  field_definition_id: string
  field_name: string
  value: string | number | boolean
  set_by_user_id: string
  created_at: string
  updated_at: string
}
