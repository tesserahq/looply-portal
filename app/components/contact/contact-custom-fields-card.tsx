import { SetCustomFieldValueDialog } from '@/components/dialog/set-custom-field-value-dialog'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import NewButton from '@/components/new-button/new-button'
import { NodeENVType } from '@/libraries/fetch'
import {
  useContactCustomFieldValues,
  useCustomFieldDefinitions,
  useDeleteContactCustomFieldValue,
} from '@/resources/hooks/custom-fields'
import { ContactCustomFieldValueType } from '@/resources/queries/custom-fields'
import { Button } from '@/modules/shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Edit, Trash2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useApp } from 'tessera-ui'

interface ContactCustomFieldsCardProps {
  apiUrl: string
  nodeEnv: NodeENVType
  contactExternalId: string | null | undefined
}

export const ContactCustomFieldsCard = ({
  apiUrl,
  nodeEnv,
  contactExternalId,
}: ContactCustomFieldsCardProps) => {
  const { token } = useApp()
  const config = { apiUrl, token: token!, nodeEnv }
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingValue, setEditingValue] = useState<ContactCustomFieldValueType | null>(null)
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const { data: values, isLoading } = useContactCustomFieldValues(config, contactExternalId || '', {
    enabled: !!contactExternalId,
  })

  const { data: definitionsData } = useCustomFieldDefinitions(
    config,
    { page: 1, size: 100 },
    { enabled: !!contactExternalId }
  )

  const { mutate: deleteValue } = useDeleteContactCustomFieldValue(
    config,
    contactExternalId || '',
    {
      onSuccess: () => deleteModalRef.current?.close(),
    }
  )

  const handleDelete = useCallback(
    (value: ContactCustomFieldValueType) => {
      deleteModalRef.current?.open({
        title: 'Remove Custom Field Value',
        description: `This will remove the "${value.field_name}" value from this contact. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteValue(value.field_name)
        },
      })
    },
    [deleteValue]
  )

  const definitionForValue = (value: ContactCustomFieldValueType) =>
    definitionsData?.items.find((d) => d.id === value.field_definition_id)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Custom Fields</CardTitle>
          {contactExternalId && (
            <NewButton
              label="Add Value"
              onClick={() => {
                setEditingValue(null)
                setDialogOpen(true)
              }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!contactExternalId ? (
          <p className="text-muted-foreground text-sm">
            This contact has no external host platform identity, so custom field values can&apos;t
            be set for it yet.
          </p>
        ) : isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : !values || values.length === 0 ? (
          <p className="text-muted-foreground text-sm">No custom field values set.</p>
        ) : (
          <div className="d-list">
            {values.map((value) => (
              <div key={value.id} className="d-item">
                <dt className="d-label">{value.field_name}</dt>
                <dd className="d-content flex items-center gap-2">
                  <span>{String(value.value)}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      setEditingValue(value)
                      setDialogOpen(true)
                    }}>
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-destructive hover:text-destructive-foreground h-6 w-6"
                    onClick={() => handleDelete(value)}>
                    <Trash2 size={14} />
                  </Button>
                </dd>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {contactExternalId && (
        <SetCustomFieldValueDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          apiUrl={apiUrl}
          nodeEnv={nodeEnv}
          contactExternalId={contactExternalId}
          excludeDefinitionIds={
            editingValue ? [] : (values || []).map((v) => v.field_definition_id)
          }
          fixedDefinition={editingValue ? definitionForValue(editingValue) : undefined}
          initialValue={editingValue?.value}
        />
      )}

      <DeleteConfirmation ref={deleteModalRef} />
    </Card>
  )
}
