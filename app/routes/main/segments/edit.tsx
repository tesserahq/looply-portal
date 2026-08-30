import { SegmentForm } from '@/components/crud-forms/segment-form'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from 'tessera-ui'
import { useSegmentDetail, useUpdateSegment } from '@/resources/hooks/segments'
import { CreateSegmentPayload } from '@/resources/queries/segments'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function SegmentEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { segment_id } = useParams<{ segment_id: string }>()

  const config = { apiUrl: apiUrl!, nodeEnv, token: token! }

  const { data: segment, isLoading } = useSegmentDetail(config, segment_id!)

  const { mutateAsync: updateSegment } = useUpdateSegment(config, {
    onSuccess: () => {
      navigate(`/segments/${segment_id}`)
    },
  })

  const handleSubmit = async (data: CreateSegmentPayload): Promise<void> => {
    await updateSegment({ id: segment_id!, updateData: data })
  }

  if (isLoading) {
    return <AppPreloader />
  }

  if (!segment) {
    return null
  }

  return (
    <div className="page-content h-full">
      <div className="mb-5">
        <h1 className="page-title">Edit segment</h1>
      </div>
      <SegmentForm
        apiUrl={apiUrl!}
        nodeEnv={nodeEnv}
        defaultValues={{ name: segment.name, rule: segment.rule.root }}
        onSubmit={handleSubmit}
        submitLabel="Update"
      />
    </div>
  )
}
