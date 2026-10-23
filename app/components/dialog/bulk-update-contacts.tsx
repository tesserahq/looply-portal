import type {
  BulkContactChanges,
  BulkContactTextField,
  BulkUpdateContactsData,
} from '@/resources/queries/contacts/contact.type'

/** The changes to apply; the parent supplies the selected contact IDs. */
export type BulkUpdateInput = Omit<BulkUpdateContactsData, 'contact_ids'>
import type {
  ContactStatusOption,
  ContactTypeOption,
} from '@/resources/queries/contacts/contact.type'
import { Button } from '@shadcn/ui/button'
import { Checkbox } from '@shadcn/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { Input } from '@shadcn/ui/input'
import { Label } from '@shadcn/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shadcn/ui/select'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { TagsInput } from 'tessera-ui/components'

const KEEP_CURRENT = '__keep_current__'

const TEXT_FIELDS: { field: BulkContactTextField; label: string }[] = [
  { field: 'company', label: 'Company' },
  { field: 'job', label: 'Job title' },
  { field: 'website', label: 'Website' },
  { field: 'address_line_1', label: 'Address line 1' },
  { field: 'address_line_2', label: 'Address line 2' },
  { field: 'city', label: 'City' },
  { field: 'state', label: 'State' },
  { field: 'zip_code', label: 'Zip code' },
  { field: 'country', label: 'Country' },
  { field: 'notes', label: 'Notes' },
]

type TextFieldState = { enabled: boolean; value: string }

const initialTextFields = (): Record<BulkContactTextField, TextFieldState> =>
  Object.fromEntries(
    TEXT_FIELDS.map(({ field }) => [field, { enabled: false, value: '' }])
  ) as Record<BulkContactTextField, TextFieldState>

interface FuncProps {
  onOpen: () => void
  onClose: () => void
}

interface IProps {
  selectedCount: number
  statuses: ContactStatusOption[]
  contactTypes: ContactTypeOption[]
  onSubmit: (data: BulkUpdateInput) => Promise<void>
}

const BulkUpdateContacts: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { selectedCount, statuses, contactTypes, onSubmit }: IProps,
  ref
) => {
  const [open, setOpen] = useState<boolean>(false)
  const [status, setStatus] = useState<string>('')
  const [contactType, setContactType] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [textFields, setTextFields] = useState(initialTextFields)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useImperativeHandle(ref, () => ({
    onOpen() {
      setStatus('')
      setContactType('')
      setTags([])
      setTextFields(initialTextFields())
      setOpen(true)
    },
    onClose() {
      setOpen(false)
    },
  }))

  const updateTextField = (field: BulkContactTextField, patch: Partial<TextFieldState>) => {
    setTextFields((prev) => ({ ...prev, [field]: { ...prev[field], ...patch } }))
  }

  const buildChanges = (): BulkContactChanges => {
    const changes: BulkContactChanges = {}
    if (status) changes.status = status
    if (contactType) changes.contact_type = contactType
    for (const { field } of TEXT_FIELDS) {
      const entry = textFields[field]
      // Checked but empty clears the field; unchecked leaves it untouched.
      if (entry.enabled) changes[field] = entry.value.trim() || null
    }
    return changes
  }

  const hasChanges = Object.keys(buildChanges()).length > 0 || tags.length > 0

  const onSave = async () => {
    if (!hasChanges) return

    const changes = buildChanges()
    const payload: BulkUpdateInput = {
      ...(Object.keys(changes).length > 0 && { changes }),
      ...(tags.length > 0 && { add_tags: tags }),
    }

    setIsSubmitting(true)
    try {
      // Parent adds the selected contact IDs and handles success/error feedback.
      await onSubmit(payload)
    } catch {
      // Error feedback is shown by the mutation hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="mb-2">Edit Contacts</DialogTitle>
          <DialogDescription>
            Apply these changes to <b>{selectedCount}</b> selected contact
            {selectedCount === 1 ? '' : 's'}. Fields you leave unchecked stay as they are.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select
              value={status || KEEP_CURRENT}
              onValueChange={(value) => setStatus(value === KEEP_CURRENT ? '' : value)}>
              <SelectTrigger className="bg-card w-full">
                <SelectValue placeholder="Keep current" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={KEEP_CURRENT}>Keep current</SelectItem>
                {statuses.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">Contact type</Label>
            <Select
              value={contactType || KEEP_CURRENT}
              onValueChange={(value) => setContactType(value === KEEP_CURRENT ? '' : value)}>
              <SelectTrigger className="bg-card w-full">
                <SelectValue placeholder="Keep current" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={KEEP_CURRENT}>Keep current</SelectItem>
                {contactTypes.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2">
          <Label className="mb-1.5 block">Add tags</Label>
          <TagsInput
            value={tags}
            onChange={setTags}
            placeholder="Add tags to every selected contact"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Existing tags on each contact are kept.
          </p>
        </div>

        <div className="mt-2 space-y-3">
          <p className="text-muted-foreground text-xs">
            Check a field to change it. Checked and left empty clears the field on every selected
            contact.
          </p>
          {TEXT_FIELDS.map(({ field, label }) => {
            const entry = textFields[field]
            return (
              <div key={field} className="grid grid-cols-[auto_9rem_1fr] items-center gap-3">
                <Checkbox
                  checked={entry.enabled}
                  onCheckedChange={(value) => updateTextField(field, { enabled: !!value })}
                  aria-label={`Change ${label}`}
                />
                <Label>{label}</Label>
                <Input
                  value={entry.value}
                  disabled={!entry.enabled}
                  placeholder={entry.enabled ? 'Empty clears the field' : 'Unchanged'}
                  onChange={(e) => updateTextField(field, { value: e.target.value })}
                />
              </div>
            )
          })}
        </div>

        <DialogFooter className="flex w-full items-center justify-end!">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={isSubmitting || !hasChanges} onClick={onSave}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default forwardRef(BulkUpdateContacts)
