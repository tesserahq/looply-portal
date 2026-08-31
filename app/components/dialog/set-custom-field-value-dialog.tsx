import { useApp } from 'tessera-ui'
import { NodeENVType } from '@/libraries/fetch'
import { Button } from '@/modules/shadcn/ui/button'
import { Calendar } from '@/modules/shadcn/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/shadcn/ui/dialog'
import { Input } from '@/modules/shadcn/ui/input'
import { Label } from '@/modules/shadcn/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcn/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcn/ui/select'
import { Switch } from '@/modules/shadcn/ui/switch'
import {
  useCustomFieldDefinitions,
  useSetContactCustomFieldValue,
} from '@/resources/hooks/custom-fields'
import { CustomFieldDefinitionType } from '@/resources/queries/custom-fields'
import { cn } from '@shadcn/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface SetCustomFieldValueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiUrl: string
  nodeEnv: NodeENVType
  contactExternalId: string
  /** Definitions already set on this contact - excluded from the picker in "add" mode. */
  excludeDefinitionIds?: string[]
  /**
   * When set, the field is fixed (edit mode) - the picker is skipped and only the
   * value input for this definition is shown, pre-filled with initialValue.
   */
  fixedDefinition?: CustomFieldDefinitionType
  initialValue?: string | number | boolean
}

function defaultValueForType(valueType: CustomFieldDefinitionType['value_type']) {
  if (valueType === 'boolean') return false
  return ''
}

export const SetCustomFieldValueDialog = ({
  open,
  onOpenChange,
  apiUrl,
  nodeEnv,
  contactExternalId,
  excludeDefinitionIds = [],
  fixedDefinition,
  initialValue,
}: SetCustomFieldValueDialogProps) => {
  const { token } = useApp()
  const config = { apiUrl, token: token!, nodeEnv }

  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string>('')
  const [value, setValue] = useState<string | number | boolean>('')

  const { data: definitionsData, isLoading: isLoadingDefinitions } = useCustomFieldDefinitions(
    config,
    { page: 1, size: 100 },
    { enabled: open && !fixedDefinition }
  )

  const availableDefinitions = useMemo(
    () =>
      (definitionsData?.items || []).filter(
        (definition) => !excludeDefinitionIds.includes(definition.id)
      ),
    [definitionsData, excludeDefinitionIds]
  )

  const selectedDefinition =
    fixedDefinition ?? availableDefinitions.find((d) => d.id === selectedDefinitionId)

  const { mutateAsync: setValueMutation, isPending } = useSetContactCustomFieldValue(
    config,
    contactExternalId,
    {
      onSuccess: () => {
        onOpenChange(false)
      },
    }
  )

  // Reset local state whenever the dialog opens for a new field/value.
  useEffect(() => {
    if (!open) return
    setSelectedDefinitionId(fixedDefinition?.id ?? '')
    setValue(initialValue ?? defaultValueForType(fixedDefinition?.value_type ?? 'string'))
  }, [open, fixedDefinition, initialValue])

  const handleDefinitionChange = (definitionId: string) => {
    setSelectedDefinitionId(definitionId)
    const definition = availableDefinitions.find((d) => d.id === definitionId)
    setValue(defaultValueForType(definition?.value_type ?? 'string'))
  }

  const handleSubmit = async () => {
    if (!selectedDefinition) return
    await setValueMutation({ fieldName: selectedDefinition.name, value })
  }

  const canSubmit = Boolean(selectedDefinition) && value !== '' && !isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {fixedDefinition ? `Edit "${fixedDefinition.name}"` : 'Add Custom Field Value'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!fixedDefinition && (
            <div className="space-y-2">
              <Label>Field</Label>
              <Select value={selectedDefinitionId} onValueChange={handleDefinitionChange}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingDefinitions ? 'Loading fields...' : 'Select a custom field'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableDefinitions.length === 0 && !isLoadingDefinitions ? (
                    <div className="text-muted-foreground p-2 text-sm">
                      No custom fields available to set.
                    </div>
                  ) : (
                    availableDefinitions.map((definition) => (
                      <SelectItem key={definition.id} value={definition.id}>
                        {definition.label || definition.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedDefinition && (
            <div className="space-y-2">
              <Label>Value</Label>
              {selectedDefinition.value_type === 'string' && (
                <Input
                  value={value as string}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter a value"
                  autoFocus
                />
              )}
              {selectedDefinition.value_type === 'number' && (
                <Input
                  type="number"
                  value={value as string | number}
                  onChange={(e) => setValue(e.target.valueAsNumber)}
                  placeholder="Enter a number"
                  autoFocus
                />
              )}
              {selectedDefinition.value_type === 'boolean' && (
                <div className="flex items-center gap-2">
                  <Switch checked={Boolean(value)} onCheckedChange={(v) => setValue(v)} />
                  <span className="text-muted-foreground text-sm">{value ? 'True' : 'False'}</span>
                </div>
              )}
              {selectedDefinition.value_type === 'date' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !value && 'text-muted-foreground'
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {value ? format(new Date(value as string), 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={value ? new Date(value as string) : undefined}
                      onSelect={(date) => setValue(date ? format(date, 'yyyy-MM-dd') : '')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
