import { AppPreloader } from '@/components/loader/pre-loader'
import { Button } from '@/modules/shadcn/ui/button'
import { useApp } from 'tessera-ui'
import {
  useCustomFieldDefinitionDetail,
  useUpdateCustomFieldDefinition,
} from '@/resources/hooks/custom-fields'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Input } from '@/modules/shadcn/ui/input'
import { Label } from '@/modules/shadcn/ui/label'
import { Loader2 } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { useLoaderData, useNavigate, useParams } from 'react-router'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function CustomFieldEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { definition_id } = useParams<{ definition_id: string }>()

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { data: definition, isLoading } = useCustomFieldDefinitionDetail(config, definition_id!, {
    enabled: !!definition_id,
  })

  const [label, setLabel] = useState('')

  useEffect(() => {
    if (definition) setLabel(definition.label || '')
  }, [definition])

  const { mutateAsync: updateDefinition, isPending } = useUpdateCustomFieldDefinition(config, {
    onSuccess: () => {
      navigate(`/custom-fields/${definition_id}`)
    },
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await updateDefinition({ id: definition_id!, updateData: { label } })
  }

  if (isLoading) {
    return <AppPreloader />
  }

  if (!definition) {
    return null
  }

  return (
    <div className="animate-slide-up mx-auto w-full max-w-screen-md p-5">
      <Card>
        <CardHeader>
          <CardTitle>Edit Custom Field</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={definition.name} disabled />
              <p className="text-muted-foreground text-xs">
                Immutable once created - delete and recreate to change it.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Value Type</Label>
              <Input value={definition.value_type} disabled />
              <p className="text-muted-foreground text-xs">
                Immutable once created - delete and recreate to change it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="A friendlier display name (optional)"
                autoFocus
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(`/custom-fields/${definition_id}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
