import { z } from 'zod/v4'

// ============================================================================
// API Schemas (for server-side validation)
// ============================================================================

/**
 * Base contact interaction schema with common fields
 */
const baseContactInteractionSchema = z.object({
  contact_id: z.string().min(1, 'Contact ID is required'),
  note: z.string().min(1, 'Note is required'),
  interaction_timestamp: z.string().min(1, 'Interaction timestamp is required'),
  action: z.string().min(1, 'Action is required'),
  action_timestamp: z.string().min(1, 'Action timestamp is required'),
  custom_action_description: z.string().optional(),
})

/**
 * Create contact interaction schema
 */
export const createContactInteractionSchema = baseContactInteractionSchema

/**
 * Update contact interaction schema (all fields optional)
 */
export const updateContactInteractionSchema = baseContactInteractionSchema.partial()

/**
 * Contact interaction list parameters schema
 */
export const contactInteractionListParamsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
    sortBy: z
      .enum(['interaction_timestamp', 'action_timestamp', 'created_at', 'updated_at'])
      .default('interaction_timestamp'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .transform((params) => {
    const sortMap = {
      interaction_timestamp: 'interaction_timestamp',
      action_timestamp: 'action_timestamp',
      created_at: 'created_at',
      updated_at: 'updated_at',
    } as const

    return {
      ...params,
      sortBy: sortMap[params.sortBy],
      sortOrder: params.sortOrder,
    }
  })

/**
 * Bulk operations schema
 */
export const bulkContactInteractionOperationSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
  operation: z.enum(['delete']),
})

// ============================================================================
// Form Schema (for client-side form validation)
// ============================================================================

/**
 * Contact interaction form validation schema
 */
export const contactInteractionFormSchema = z.object({
  id: z.string().optional(),
  contact_id: z.string().min(1, 'Contact is required'),
  note: z.string().min(1, 'Note is required'),
  interaction_timestamp: z.string().min(1, 'Interaction timestamp is required'),
  action: z.string().min(1, 'Action is required'),
  action_timestamp: z.string().min(1, 'Action timestamp is required'),
  custom_action_description: z.string().optional(),
  created_by_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type ContactInteractionFormValue = z.infer<typeof contactInteractionFormSchema>

/**
 * Default values for new contact interaction
 */
export const defaultContactInteractionFormValues: ContactInteractionFormValue = {
  id: '',
  contact_id: '',
  note: '',
  interaction_timestamp: new Date().toISOString(),
  action: '',
  action_timestamp: '',
}

// ============================================================================
// Inferred TypeScript types
// ============================================================================

export type CreateContactInteractionInput = z.infer<typeof createContactInteractionSchema>
export type UpdateContactInteractionInput = z.infer<typeof updateContactInteractionSchema>
export type ContactInteractionListParamsInput = z.infer<
  typeof contactInteractionListParamsSchema
>
export type BulkContactInteractionOperationInput = z.infer<
  typeof bulkContactInteractionOperationSchema
>

// ============================================================================
// Legacy exports (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use contactInteractionFormSchema instead
 */
export const contactInteractionSchema = z.object({
  id: z.string(),
  contact_id: z.string(),
  note: z.string().min(1, 'Note is required'),
  interaction_timestamp: z.string(),
  action: z.string(),
  action_timestamp: z.string(),
  created_by_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * @deprecated Use ContactInteractionFormValue instead
 */
export type ContactInteractionSchema = z.infer<typeof contactInteractionSchema>

/**
 * @deprecated Use defaultContactInteractionFormValues instead
 */
export const defaultContactInteraction: ContactInteractionFormValue =
  defaultContactInteractionFormValues
