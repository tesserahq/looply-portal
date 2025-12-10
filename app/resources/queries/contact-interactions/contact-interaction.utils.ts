import { ContactInteractionFormValue } from './contact-interaction.schema'
import {
  ContactInteractionFormData,
  ContactInteractionType,
} from './contact-interaction.type'

/**
 * Convert contact interaction data to form values
 */
export function contactInteractionToFormValues(
  contact: ContactInteractionType,
): ContactInteractionFormValue {
  return {
    id: contact.id,
    contact_id: contact.contact_id,
    note: contact.note || '',
    interaction_timestamp: contact.interaction_timestamp,
    action: contact.action,
    action_timestamp: contact.action_timestamp,
    created_by_id: contact.created_by_id,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
    ...(contact.custom_action_description && {
      custom_action_description: contact.custom_action_description,
    }),
  }
}

/**
 * Convert form values to location data (for submission)
 */
export function formValuesToContactInteractionData(
  formValues: ContactInteractionFormValue,
): ContactInteractionFormData {
  return {
    contact_id: formValues.contact_id,
    note: formValues.note || '',
    interaction_timestamp: formValues.interaction_timestamp,
    action: formValues.action,
    action_timestamp: formValues.action_timestamp,
    ...(formValues.custom_action_description && {
      custom_action_description: formValues.custom_action_description,
    }),
  }
}
