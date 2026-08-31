import { z } from 'zod/v4'
import { IDENTITY_KEY_TARGETS } from './event-field-mapping.type'

/**
 * Event-to-field mapping form validation schema. Immutable once created - there
 * is no update schema; delete and recreate to change it.
 *
 * Mirrors the backend's EventFieldMappingCreateRequest validation
 * (app/schemas/event_field_mapping.py): target_field is required (and only
 * meaningful) for target_type="contact_field", field_name is required (and
 * only meaningful) for target_type="custom_field", and is_identity_key is
 * only valid alongside target_type="contact_field" with target_field in
 * IDENTITY_KEY_TARGETS.
 */
export const eventFieldMappingFormSchema = z
  .object({
    event_type: z.string().min(1, 'Event type is required'),
    source_path: z
      .string()
      .min(1, 'Source path is required')
      .regex(
        /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/,
        "Dot-separated path into the event's data (e.g. person.account.family_member_count)"
      ),
    target_type: z.enum(['contact_field', 'custom_field']),
    target_field: z.string().optional(),
    field_name: z.string().optional(),
    is_identity_key: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.target_type === 'contact_field') {
      if (!data.target_field) {
        ctx.addIssue({
          code: 'custom',
          path: ['target_field'],
          message: 'Target Contact field is required',
        })
      }
      if (
        data.is_identity_key &&
        data.target_field &&
        !IDENTITY_KEY_TARGETS.includes(data.target_field as (typeof IDENTITY_KEY_TARGETS)[number])
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['target_field'],
          message: 'Identity key mappings must target External ID or Email',
        })
      }
    } else if (!data.field_name) {
      ctx.addIssue({
        code: 'custom',
        path: ['field_name'],
        message: 'Target custom field is required',
      })
    }
  })

export type EventFieldMappingFormValue = z.infer<typeof eventFieldMappingFormSchema>

export const defaultEventFieldMappingFormValues: EventFieldMappingFormValue = {
  event_type: '',
  source_path: '',
  target_type: 'custom_field',
  target_field: '',
  field_name: '',
  is_identity_key: false,
}
