import { fetchApi } from '@/libraries/fetch'
import { IPaging } from '@/resources/types'
import { IQueryConfig, IQueryParams } from '..'
import {
  ContactCustomFieldValueType,
  CreateCustomFieldDefinitionPayload,
  CustomFieldDefinitionType,
  UpdateCustomFieldDefinitionPayload,
} from './custom-field.type'

const CUSTOM_FIELD_DEFINITIONS_ENDPOINT = '/custom-field-definitions'

/**
 * List all custom field definitions with pagination.
 */
export async function getCustomFieldDefinitions(
  config: IQueryConfig,
  params: IQueryParams
): Promise<IPaging<CustomFieldDefinitionType>> {
  const { apiUrl, token, nodeEnv } = config
  const { page, size } = params

  const response = await fetchApi(`${apiUrl}${CUSTOM_FIELD_DEFINITIONS_ENDPOINT}`, token, nodeEnv, {
    method: 'GET',
    pagination: { page, size },
  })

  return response as IPaging<CustomFieldDefinitionType>
}

/**
 * Get a custom field definition by ID.
 */
export async function getCustomFieldDefinition(
  config: IQueryConfig,
  id: string
): Promise<CustomFieldDefinitionType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}${CUSTOM_FIELD_DEFINITIONS_ENDPOINT}/${id}`,
    token,
    nodeEnv,
    { method: 'GET' }
  )

  return response as CustomFieldDefinitionType
}

/**
 * Create a new custom field definition.
 */
export async function createCustomFieldDefinition(
  config: IQueryConfig,
  data: CreateCustomFieldDefinitionPayload
): Promise<CustomFieldDefinitionType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(`${apiUrl}${CUSTOM_FIELD_DEFINITIONS_ENDPOINT}`, token, nodeEnv, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response as CustomFieldDefinitionType
}

/**
 * Update a custom field definition's label.
 */
export async function updateCustomFieldDefinition(
  config: IQueryConfig,
  id: string,
  data: UpdateCustomFieldDefinitionPayload
): Promise<CustomFieldDefinitionType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}${CUSTOM_FIELD_DEFINITIONS_ENDPOINT}/${id}`,
    token,
    nodeEnv,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )

  return response as CustomFieldDefinitionType
}

/**
 * Delete a custom field definition by ID.
 */
export async function deleteCustomFieldDefinition(config: IQueryConfig, id: string): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(`${apiUrl}${CUSTOM_FIELD_DEFINITIONS_ENDPOINT}/${id}`, token, nodeEnv, {
    method: 'DELETE',
  })
}

/**
 * List a contact's current custom field values, keyed by the contact's external_id.
 */
export async function getContactCustomFieldValues(
  config: IQueryConfig,
  externalId: string
): Promise<ContactCustomFieldValueType[]> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contacts/${externalId}/custom-fields`,
    token,
    nodeEnv,
    { method: 'GET' }
  )

  return response as ContactCustomFieldValueType[]
}

/**
 * Upsert a contact's value for a named field.
 */
export async function setContactCustomFieldValue(
  config: IQueryConfig,
  externalId: string,
  fieldName: string,
  value: string | number | boolean
): Promise<ContactCustomFieldValueType> {
  const { apiUrl, token, nodeEnv } = config

  const response = await fetchApi(
    `${apiUrl}/contacts/${externalId}/custom-fields/${encodeURIComponent(fieldName)}`,
    token,
    nodeEnv,
    {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }
  )

  return response as ContactCustomFieldValueType
}

/**
 * Delete a contact's value for a named field.
 */
export async function deleteContactCustomFieldValue(
  config: IQueryConfig,
  externalId: string,
  fieldName: string
): Promise<void> {
  const { apiUrl, token, nodeEnv } = config

  await fetchApi(
    `${apiUrl}/contacts/${externalId}/custom-fields/${encodeURIComponent(fieldName)}`,
    token,
    nodeEnv,
    { method: 'DELETE' }
  )
}
