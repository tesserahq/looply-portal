import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import { SegmentRuleBuilder } from '@/components/form/segment-rule-builder'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { useApp } from 'tessera-ui'
import { DateTime, ResourceID } from 'tessera-ui/components'
import {
  useDeleteSegment,
  useSegmentDetail,
  useSegmentPreviewById,
} from '@/resources/hooks/segments'
import { Link, useLoaderData, useNavigate, useParams } from 'react-router'
import { Edit, EllipsisVertical, Trash2, Users } from 'lucide-react'
import { useCallback, useRef } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function SegmentDetail() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = { apiUrl: apiUrl!, nodeEnv, token: token! }

  const segmentId = params.segment_id || ''

  const { data: segment, isLoading } = useSegmentDetail(config, segmentId, {
    enabled: !!segmentId && !!token,
  })

  const { data: preview, isLoading: isLoadingPreview } = useSegmentPreviewById(config, segmentId, {
    enabled: !!segmentId && !!token,
  })

  const { mutate: deleteSegment } = useDeleteSegment(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/segments')
    },
  })

  const handleDelete = useCallback(() => {
    if (!segment) return

    deleteModalRef.current?.open({
      title: 'Remove Segment',
      description: `This will remove "${segment.name}" from your segments. Campaigns already referencing it are not affected. This action cannot be undone.`,
      onDelete: async () => {
        deleteModalRef.current?.updateConfig({ isLoading: true })
        await deleteSegment(segmentId)
      },
    })
  }, [segment, segmentId, deleteSegment])

  if (isLoading) {
    return <AppPreloader />
  }

  if (!segment) {
    return (
      <div className="animate-slide-up flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Segment not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-slide-up h-full space-y-3">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold lg:text-3xl">Segment Details</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="px-0">
                  <EllipsisVertical size={18} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="left" className="w-40 p-2">
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/segments/${params.segment_id}/edit`)}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="hover:bg-destructive hover:text-destructive-foreground flex w-full
                    justify-start gap-2"
                  onClick={handleDelete}>
                  <Trash2 size={18} />
                  <span>Delete</span>
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pt-4">
          <div className="d-list">
            <div className="d-item">
              <dt className="d-label">ID</dt>
              <dd className="d-content">
                <ResourceID value={segment.id} />
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Name</dt>
              <dd className="d-content">{segment.name || 'N/A'}</dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Matching contacts</dt>
              <dd className="d-content">
                {isLoadingPreview ? (
                  <span className="text-muted-foreground text-sm">Calculating...</span>
                ) : (
                  <Link
                    to={`/segments/${segmentId}/contacts`}
                    className="button-link flex w-fit items-center gap-2">
                    <Users size={14} />
                    <Badge variant="outline">{preview?.contact_count ?? 0}</Badge>
                  </Link>
                )}
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Created At</dt>
              <dd className="d-content">
                <DateTime date={segment.created_at} />
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Updated At</dt>
              <dd className="d-content">
                <DateTime date={segment.updated_at} />
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold lg:text-2xl">Rule</h2>
        </CardHeader>
        <CardContent>
          <SegmentRuleBuilder
            root={segment.rule.root}
            onChange={() => {}}
            apiUrl={apiUrl!}
            nodeEnv={nodeEnv}
            disabled
          />
        </CardContent>
      </Card>

      <DeleteConfirmation ref={deleteModalRef} />
    </div>
  )
}
