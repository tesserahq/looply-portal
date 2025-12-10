import { WaitingListFormValue } from './waiting-list.schema'
import { WaitingListFormData, WaitingListType } from './waiting-list.type'

/**
 * Convert waiting list data to form values
 */
export function waitingListToFormValues(
  waitingList: WaitingListType,
): WaitingListFormValue {
  return {
    id: waitingList.id,
    name: waitingList.name,
    description: waitingList.description || '',
    created_by_id: waitingList.created_by_id,
    created_at: waitingList.created_at,
    updated_at: waitingList.updated_at,
  }
}

/**
 * Convert form values to waiting list data (for submission)
 */
export function formValuesToWaitingListData(
  formValues: WaitingListFormValue,
): WaitingListFormData {
  return {
    name: formValues.name,
    description: formValues.description || '',
  }
}

