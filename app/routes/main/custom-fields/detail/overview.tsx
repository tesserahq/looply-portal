import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import { useApp, DateTime } from 'tessera-ui'
import { ResourceID } from 'tessera-ui/components'
import {
  useCustomFieldDefinitionDetail,
  useDeleteCustomFieldDefinition,
} from '@/resources/hooks/custom-fields'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { Edit, EllipsisVertical, Trash2 } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function CustomFieldDetailOverview() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = { apiUrl: apiUrl!, nodeEnv, token: token! }

  const { data: definition, isLoading } = useCustomFieldDefinitionDetail(
    config,
    params.definition_id!,
    { enabled: !!params.definition_id && !!token }
  )

  const { mutate: deleteDefinition } = useDeleteCustomFieldDefinition(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/custom-fields')
    },
  })

  const handleDelete = useCallback(() => {
    if (!definition) return

    deleteModalRef.current?.open({
      title: 'Remove Custom Field',
      description: `This will remove "${definition.name}" and its values from all contacts. Segments referencing it will fail to resolve. This action cannot be undone.`,
      onDelete: async () => {
        deleteModalRef.current?.updateConfig({ isLoading: true })
        await deleteDefinition(definition.id)
      },
    })
  }, [definition, deleteDefinition])

  if (isLoading) {
    return <AppPreloader />
  }

  if (!definition) {
    return (
      <div className="animate-slide-up flex h-full items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Custom field not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-slide-up h-full">
      <div className="w-full lg:w-1/2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold lg:text-3xl">Overview</h1>
                <Badge variant="outline">{definition.value_type}</Badge>
              </div>
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
                    onClick={() => navigate(`/custom-fields/${params.definition_id}/edit`)}>
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
                  <ResourceID value={definition.id} />
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Name</dt>
                <dd className="d-content">{definition.name}</dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Label</dt>
                <dd className="d-content">{definition.label || 'N/A'}</dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Value Type</dt>
                <dd className="d-content">{definition.value_type}</dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Created At</dt>
                <dd className="d-content">
                  {definition.created_at ? <DateTime date={definition.created_at} /> : 'N/A'}
                </dd>
              </div>
              <div className="d-item">
                <dt className="d-label">Updated At</dt>
                <dd className="d-content">
                  {definition.updated_at ? <DateTime date={definition.updated_at} /> : 'N/A'}
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmation ref={deleteModalRef} />
    </div>
  )
}
