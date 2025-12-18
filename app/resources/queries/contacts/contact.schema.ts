import { z } from 'zod/v4'

// ============================================================================
// API Schemas (for server-side validation)
// ============================================================================

/**
 * Base contact schema with common fields
 */
const baseContactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  job: z.string().optional(),
  contact_type: z.string().optional(),
  phone_type: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').min(1, 'Email is required').or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
})

/**
 * Create contact schema
 */
export const createContactSchema = baseContactSchema

/**
 * Update contact schema (all fields optional)
 */
export const updateContactSchema = baseContactSchema.partial()

// ============================================================================
// Form Schema (for client-side form validation)
// ============================================================================

/**
 * Contact form validation schema
 */
export const contactFormSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  job: z.string().optional(),
  contact_type: z.string().optional(),
  phone_type: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        // Basic phone validation - can be enhanced with libphonenumber
        return val.length >= 10
      },
      {
        message: 'Please enter a valid phone number',
      }
    ),
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailPattern.test(val)
      },
      {
        message: 'Must have the @ sign and no spaces',
      }
    ),
  website: z
    .string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        try {
          new URL(val)
          return true
        } catch {
          return false
        }
      },
      {
        message: 'Please enter a valid URL',
      }
    ),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
  created_by_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type ContactFormValue = z.infer<typeof contactFormSchema>

/**
 * Default form values for contact form
 */
export const defaultContactFormValues: ContactFormValue = {
  first_name: '',
  middle_name: '',
  last_name: '',
  company: '',
  job: '',
  contact_type: '',
  phone_type: '',
  phone: '',
  email: '',
  website: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
  notes: '',
  is_active: true,
}
