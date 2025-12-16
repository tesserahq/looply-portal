// Query functions
export {
  fetchContactInteractions,
  fetchContactInteractionsByContactId,
  fetchContactInteractionDetail,
  fetchContactInteractionActions,
  createContactInteraction,
  updateContactInteraction,
  deleteContactInteraction,
} from './contact-interaction.queries'

// Types
export type {
  ContactInteractionType,
  ContactInteractionFormData,
  ContactInteractionQueryConfig,
  ContactInteractionQueryParams,
  ContactInteractionActionType,
} from './contact-interaction.type'

// Schemas
export {
  contactInteractionSchema,
  type ContactInteractionSchema,
  type ContactInteractionFormValue,
} from './contact-interaction.schema'

// Utils
export {
  contactInteractionToFormValues,
  formValuesToContactInteractionData,
} from './contact-interaction.utils'
