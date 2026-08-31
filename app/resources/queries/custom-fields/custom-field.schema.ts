import { z } from 'zod/v4'

/**
 * Custom field definition form validation schema. name and value_type are
 * immutable once created - there is no update schema.
 */
export const customFieldDefinitionFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Use only letters, numbers, and underscores - this is the machine name written into segment rules'
    ),
  value_type: z.enum(['string', 'number', 'boolean', 'date']),
  label: z.string().optional(),
})

export type CustomFieldDefinitionFormValue = z.infer<typeof customFieldDefinitionFormSchema>

export const defaultCustomFieldDefinitionFormValues: CustomFieldDefinitionFormValue = {
  name: '',
  value_type: 'string',
  label: '',
}
