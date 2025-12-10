import { z } from 'zod/v4'

// ============================================================================
// API Schemas (for server-side validation)
// ============================================================================

/**
 * Base contact list schema with common fields
 */
const baseContactListSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
})

/**
 * Create contact list schema
 */
export const createContactListSchema = baseContactListSchema

/**
 * Update contact list schema (all fields optional)
 */
export const updateContactListSchema = baseContactListSchema.partial()

/**
 * Contact list list parameters schema
 */
export const contactListListParamsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
    sortBy: z.enum(['name', 'created_at', 'updated_at']).default('created_at'),
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
export const bulkContactListOperationSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
  operation: z.enum(['delete']),
})

// ============================================================================
// Form Schema (for client-side form validation)
// ============================================================================

/**
 * Contact list form validation schema
 */
export const contactListFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
  created_by_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type ContactListFormValue = z.infer<typeof contactListFormSchema>

/**
 * Default values for new contact list
 */
export const defaultContactListFormValues: ContactListFormValue = {
  id: '',
  name: '',
  description: '',
  is_public: false,
}

// ============================================================================
// Inferred TypeScript types
// ============================================================================

export type CreateContactListInput = z.infer<typeof createContactListSchema>
export type UpdateContactListInput = z.infer<typeof updateContactListSchema>
export type ContactListListParamsInput = z.infer<typeof contactListListParamsSchema>
export type BulkContactListOperationInput = z.infer<typeof bulkContactListOperationSchema>

// ============================================================================
// Legacy exports (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use contactListFormSchema instead
 */
export const contactListSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
  created_by_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * @deprecated Use ContactListFormValue instead
 */
export type ContactListSchema = z.infer<typeof contactListSchema>

/**
 * @deprecated Use defaultContactListFormValues instead
 */
export const defaultContactList: ContactListFormValue = defaultContactListFormValues
