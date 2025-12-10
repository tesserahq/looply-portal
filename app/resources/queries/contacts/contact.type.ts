import { NodeENVType } from '@/libraries/fetch'

/**
 * Contact Type
 */
export type ContactType = {
  id: string
  first_name: string
  middle_name: string
  last_name: string
  company: string
  job: string
  contact_type: string
  phone_type: string
  phone: string
  email: string
  website: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  zip_code: string
  country: string
  notes: string
  is_active: boolean
  created_by_id: string
  created_at: string
  updated_at: string
}

/**
 * Contact query configuration
 * Required configuration for API queries (apiUrl, token, nodeEnv)
 */
export interface ContactQueryConfig {
  apiUrl: string
  token: string
  nodeEnv: NodeENVType
}

/**
 * Contact query parameters for pagination
 */
export interface ContactQueryParams {
  page?: number
  size?: number
  q?: string
}

/**
 * Create contact data
 */
export type CreateContactData = Omit<
  ContactType,
  'id' | 'created_by_id' | 'created_at' | 'updated_at'
>

/**
 * Update contact data (all fields optional)
 */
export type UpdateContactData = Partial<CreateContactData>

/**
 * Contact form data (for form submission)
 */
export type ContactFormData = CreateContactData
