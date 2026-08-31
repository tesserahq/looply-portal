import { z } from 'zod/v4'

/**
 * Event-to-field mapping form validation schema. Immutable once created - there
 * is no update schema; delete and recreate to change it.
 */
export const eventFieldMappingFormSchema = z.object({
  event_type: z.string().min(1, 'Event type is required'),
  source_path: z
    .string()
    .min(1, 'Source path is required')
    .regex(
      /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/,
      "Dot-separated path into the event's data (e.g. account.family_member_count)"
    ),
  field_name: z.string().min(1, 'Target custom field is required'),
})

export type EventFieldMappingFormValue = z.infer<typeof eventFieldMappingFormSchema>

export const defaultEventFieldMappingFormValues: EventFieldMappingFormValue = {
  event_type: '',
  source_path: '',
  field_name: '',
}
