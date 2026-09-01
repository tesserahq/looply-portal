import { AppPreloader } from '@/components/loader/pre-loader'
import { TagForm } from '@/components/crud-forms/tag-form'
import { useApp } from 'tessera-ui'
import { useTagDetail, useUpdateTag } from '@/resources/hooks/tags'
import { TagFormValue } from '@/resources/queries/tags'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function TagEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { tag_id } = useParams<{ tag_id: string }>()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { data: tag, isLoading } = useTagDetail(config, tag_id!, {
    enabled: !!tag_id,
  })

  const { mutateAsync: updateTag } = useUpdateTag(config, {
    onSuccess: () => {
      navigate('/tags')
    },
  })

  const handleSubmit = async (data: TagFormValue): Promise<void> => {
    await updateTag({ id: tag_id!, updateData: data })
  }

  if (isLoading) {
    return <AppPreloader />
  }

  if (!tag) {
    return null
  }

  return <TagForm title="Rename Tag" defaultValues={{ name: tag.name }} onSubmit={handleSubmit} />
}
