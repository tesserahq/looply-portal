import { z } from 'zod/v4'

/**
 * Event mapping form validation schema - mirrors the backend's
 * EventMappingCreateRequest/EventMappingUpdateRequest validation
 * (app/schemas/event_mapping.py): identity_target_field and
 * identity_source_path must be set together, or left blank together.
 */
export const eventMappingFormSchema = z
  .object({
    event_type: z.string().min(1, 'Event type is required'),
    source: z.string().optional(),
    identity_target_field: z.string().optional(),
    identity_source_path: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (Boolean(data.identity_target_field) !== Boolean(data.identity_source_path)) {
      const message = 'Identity field and identity source path must be set together'
      if (!data.identity_target_field) {
        ctx.addIssue({ code: 'custom', path: ['identity_target_field'], message })
      }
      if (!data.identity_source_path) {
        ctx.addIssue({ code: 'custom', path: ['identity_source_path'], message })
      }
    }
  })

export type EventMappingFormValue = z.infer<typeof eventMappingFormSchema>

export const defaultEventMappingFormValues: EventMappingFormValue = {
  event_type: '',
  source: '',
  identity_target_field: '',
  identity_source_path: '',
}
