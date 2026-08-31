import { z } from 'zod/v4'

/**
 * Tracked event type form validation schema. Immutable once created - there is
 * no update schema; delete and recreate to change it.
 */
export const trackedEventTypeFormSchema = z.object({
  event_type: z.string().min(1, 'Event type is required'),
})

export type TrackedEventTypeFormValue = z.infer<typeof trackedEventTypeFormSchema>

export const defaultTrackedEventTypeFormValues: TrackedEventTypeFormValue = {
  event_type: '',
}
