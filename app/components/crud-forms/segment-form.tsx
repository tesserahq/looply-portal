import { SegmentRuleBuilder } from '@/components/form/segment-rule-builder'
import { NodeENVType } from '@/libraries/fetch'
import { useSegmentPreview } from '@/resources/hooks/segments'
import {
  CreateSegmentPayload,
  defaultListMembershipLeaf,
  isRuleComplete,
} from '@/resources/queries/segments'
import { SegmentRuleNode } from '@/resources/queries/segments/segment.type'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Input } from '@shadcn/ui/input'
import { Label } from '@shadcn/ui/label'
import { Loader2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from 'tessera-ui'

export interface SegmentFormDefaultValues {
  name: string
  rule: SegmentRuleNode
}

export interface SegmentFormProps {
  apiUrl: string
  nodeEnv: NodeENVType
  defaultValues?: SegmentFormDefaultValues
  onSubmit: (data: CreateSegmentPayload) => Promise<void> | void
  submitLabel?: string
  disabled?: boolean
}

export const SegmentForm = ({
  apiUrl,
  nodeEnv,
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
  disabled = false,
}: SegmentFormProps) => {
  const { token } = useApp()
  const navigate = useNavigate()
  const config = { apiUrl, token: token!, nodeEnv }

  const [name, setName] = useState(defaultValues?.name ?? '')
  const [root, setRoot] = useState<SegmentRuleNode>(
    defaultValues?.rule ?? defaultListMembershipLeaf()
  )
  const [nameError, setNameError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    mutate: preview,
    data: previewResult,
    isPending: isPreviewLoading,
  } = useSegmentPreview(config)

  useEffect(() => {
    // A half-filled leaf (no list/campaign picked yet) would 422 - only
    // preview once the whole tree is well-formed.
    if (isRuleComplete(root)) {
      preview({ root })
    }
  }, [root, preview])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError('Name is required')
      return
    }
    setNameError(undefined)

    setIsSubmitting(true)
    try {
      await onSubmit({ name, rule: { root } })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mb-5 animate-slide-up">
      <CardHeader>
        <CardTitle>Segment details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
            autoFocus
          />
          {nameError && <p className="text-destructive mt-1 text-sm font-medium">{nameError}</p>}
        </div>

        <div>
          <Label>Rule</Label>
          <div className="mt-1.5">
            <SegmentRuleBuilder
              root={root}
              onChange={setRoot}
              apiUrl={apiUrl}
              nodeEnv={nodeEnv}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users size={16} />
          {isPreviewLoading ? (
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-3 w-3 animate-spin" />
              Calculating audience...
            </span>
          ) : !isRuleComplete(root) ? (
            <span className="text-muted-foreground text-sm">
              Complete the rule above to preview its audience
            </span>
          ) : (
            <p>
              This segment currently matches <b>{previewResult?.contact_count ?? 0}</b>{' '}
              {previewResult?.contact_count === 1 ? 'contact' : 'contacts'}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate('/segments')}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || disabled}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
