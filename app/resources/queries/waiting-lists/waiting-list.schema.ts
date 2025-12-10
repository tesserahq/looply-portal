import { z } from 'zod/v4'

// ============================================================================
// API Schemas (for server-side validation)
// ============================================================================

/**
 * Base waiting list schema with common fields
 */
const baseWaitingListSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

/**
 * Create waiting list schema
 */
export const createWaitingListSchema = baseWaitingListSchema

/**
 * Update waiting list schema (all fields optional)
 */
export const updateWaitingListSchema = baseWaitingListSchema.partial()

/**
 * Waiting list list parameters schema
 */
export const waitingListListParamsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
    sortBy: z
      .enum(['name', 'created_at', 'updated_at'])
      .default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .transform((params) => {
    const sortMap = {
      name: 'name',
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
export const bulkWaitingListOperationSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
  operation: z.enum(['delete']),
})

// ============================================================================
// Form Schema (for client-side form validation)
// ============================================================================

/**
 * Waiting list form validation schema
 */
export const waitingListFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  created_by_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type WaitingListFormValue = z.infer<typeof waitingListFormSchema>

/**
 * Default values for new waiting list
 */
export const defaultWaitingListFormValues: WaitingListFormValue = {
  id: '',
  name: '',
  description: '',
}

// ============================================================================
// Inferred TypeScript types
// ============================================================================

export type CreateWaitingListInput = z.infer<typeof createWaitingListSchema>
export type UpdateWaitingListInput = z.infer<typeof updateWaitingListSchema>
export type WaitingListListParamsInput = z.infer<typeof waitingListListParamsSchema>
export type BulkWaitingListOperationInput = z.infer<
  typeof bulkWaitingListOperationSchema
>

// ============================================================================
// Legacy exports (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use waitingListFormSchema instead
 */
export const waitingListSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  created_by_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * @deprecated Use WaitingListFormValue instead
 */
export type WaitingListSchema = z.infer<typeof waitingListSchema>

/**
 * @deprecated Use defaultWaitingListFormValues instead
 */
export const defaultWaitingList: WaitingListFormValue = defaultWaitingListFormValues

