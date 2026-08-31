import { CustomFieldDefinitionForm } from '@/components/crud-forms/custom-field-definition-form'
import { useApp } from 'tessera-ui'
import { useCreateCustomFieldDefinition } from '@/resources/hooks/custom-fields'
import { CreateCustomFieldDefinitionPayload } from '@/resources/queries/custom-fields'
import { useLoaderData, useNavigate } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function CustomFieldNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { mutateAsync: createDefinition } = useCreateCustomFieldDefinition(config, {
    onSuccess: () => {
      navigate('/custom-fields')
    },
  })

  const handleSubmit = async (data: CreateCustomFieldDefinitionPayload): Promise<void> => {
    await createDefinition(data)
  }

  return <CustomFieldDefinitionForm onSubmit={handleSubmit} />
}
