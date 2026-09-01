import { z } from 'zod/v4'

/**
 * Attribute mapping form validation schema - mirrors the backend's
 * EventFieldMappingCreateRequest validation (app/schemas/event_field_mapping.py):
 * target_field is required (and only meaningful) for target_type="contact_field",
 * field_name is required (and only meaningful) for target_type="custom_field".
 * event_type/is_identity_key are no longer part of this form - the parent
 * EventMapping (scoped by the URL) owns both.
 */
export const eventFieldMappingFormSchema = z
  .object({
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
  source_path: '',
  target_type: 'custom_field',
  target_field: '',
  field_name: '',
}
