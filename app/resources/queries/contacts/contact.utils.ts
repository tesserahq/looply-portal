import { ContactType } from './contact.type'
import { ContactFormValue } from './contact.schema'

/**
 * Convert contact API data to form values
 */
export function contactToFormValues(contact: ContactType): ContactFormValue {
  return {
    id: contact.id,
    first_name: contact.first_name || '',
    middle_name: contact.middle_name || '',
    last_name: contact.last_name || '',
    company: contact.company || '',
    job: contact.job || '',
    contact_type: contact.contact_type || '',
    phone_type: contact.phone_type || '',
    phone: contact.phone || '',
    email: contact.email || '',
    website: contact.website || '',
    address_line_1: contact.address_line_1 || '',
    address_line_2: contact.address_line_2 || '',
    city: contact.city || '',
    state: contact.state || '',
    zip_code: contact.zip_code || '',
    country: contact.country || '',
    notes: contact.notes || '',
    is_active: contact.is_active ?? true,
    created_by_id: contact.created_by_id || '',
    created_at: contact.created_at || '',
    updated_at: contact.updated_at || '',
  }
}

/**
 * Convert form values to contact API data
 */
export function formValuesToContactData(
  formValues: ContactFormValue
): Omit<ContactType, 'id' | 'created_by_id' | 'created_at' | 'updated_at'> {
  return {
    first_name: formValues.first_name,
    middle_name: formValues.middle_name || '',
    last_name: formValues.last_name || '',
    company: formValues.company || '',
    job: formValues.job || '',
    contact_type: formValues.contact_type || '',
    phone_type: formValues.phone_type || '',
    phone: formValues.phone || '',
    email: formValues.email || '',
    website: formValues.website || '',
    address_line_1: formValues.address_line_1 || '',
    address_line_2: formValues.address_line_2 || '',
    city: formValues.city || '',
    state: formValues.state || '',
    zip_code: formValues.zip_code || '',
    country: formValues.country || '',
    notes: formValues.notes || '',
    is_active: formValues.is_active ?? true,
  }
}
