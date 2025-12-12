import { ContactInteractionFormValue } from './contact-interaction.schema'
import {
  ContactInteractionFormData,
  ContactInteractionType,
} from './contact-interaction.type'

/**
 * Convert contact interaction data to form values
 */
export function contactInteractionToFormValues(
  interaction: ContactInteractionType,
): ContactInteractionFormValue {
  return {
    id: interaction.id,
    contact_id: interaction.contact_id,
    note: interaction.note || '',
    interaction_timestamp: interaction.interaction_timestamp,
    action: interaction.action,
    action_timestamp: interaction.action_timestamp || '',
    created_by_id: interaction.created_by_id,
    created_at: interaction.created_at,
    updated_at: interaction.updated_at,
    ...(interaction.custom_action_description && {
      custom_action_description: interaction.custom_action_description,
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
    note: formValues.note,
    interaction_timestamp: formValues.interaction_timestamp,
    action: formValues.action || '',
    ...(formValues.action_timestamp && { action_timestamp: formValues.action_timestamp }),
    ...(formValues.custom_action_description && {
      custom_action_description: formValues.custom_action_description,
    }),
  }
}
