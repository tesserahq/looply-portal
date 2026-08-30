import { SegmentForm } from '@/components/crud-forms/segment-form'
import { useApp } from 'tessera-ui'
import { useCreateSegment } from '@/resources/hooks/segments'
import { CreateSegmentPayload, SegmentType } from '@/resources/queries/segments'
import { useLoaderData, useNavigate } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function SegmentNew() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { mutateAsync: createSegment } = useCreateSegment(config, {
    onSuccess: (data: SegmentType) => {
      navigate(`/segments/${data.id}`)
    },
  })

  const handleSubmit = async (data: CreateSegmentPayload): Promise<void> => {
    await createSegment(data)
  }

  return (
    <div className="page-content h-full">
      <div className="mb-5">
        <h1 className="page-title">New segment</h1>
      </div>
      <SegmentForm apiUrl={apiUrl!} nodeEnv={nodeEnv} onSubmit={handleSubmit} />
    </div>
  )
}
