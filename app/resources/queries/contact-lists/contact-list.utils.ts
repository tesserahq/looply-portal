import { ContactListFormValue } from './contact-list.schema'
import { ContactListFormData, ContactListType } from './contact-list.type'

/**
 * Convert contact list data to form values
 */
export function contactListToFormValues(
  contactList: ContactListType,
): ContactListFormValue {
  return {
    id: contactList.id,
    name: contactList.name,
    description: contactList.description || '',
    is_public: contactList.is_public || false,
    created_by_id: contactList.created_by_id,
    created_at: contactList.created_at,
    updated_at: contactList.updated_at,
  }
}

/**
 * Convert form values to contact list data (for submission)
 */
export function formValuesToContactListData(
  formValues: ContactListFormValue,
): ContactListFormData {
  return {
    name: formValues.name,
    description: formValues.description || '',
    is_public: formValues.is_public || false,
  }
}
