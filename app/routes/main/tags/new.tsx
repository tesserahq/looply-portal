import { TagForm } from '@/components/crud-forms/tag-form'
import { useApp } from 'tessera-ui'
import { useCreateTag } from '@/resources/hooks/tags'
import { CreateTagPayload } from '@/resources/queries/tags'
import { useLoaderData, useNavigate } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function TagNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { mutateAsync: createTag } = useCreateTag(config, {
    onSuccess: () => {
      navigate('/tags')
    },
  })

  const handleSubmit = async (data: CreateTagPayload): Promise<void> => {
    await createTag(data)
  }

  return <TagForm title="New Tag" onSubmit={handleSubmit} />
}
