import { Button } from '@/modules/shadcn/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcn/ui/select'
import Separator from '@/modules/shadcn/ui/separator'
import {
  CONTACT_PROPERTIES,
  ContactProperty,
  IContactPropertyMapping,
} from '@/routes/_main+/contacts+/imports'

interface IProps {
  columnMapping: IContactPropertyMapping
  setColumnMapping: (columnMapping: IContactPropertyMapping) => void
  handlePreview: () => void
  handleCancel: () => void
}

export function ImportContactsSetProperties({
  columnMapping,
  setColumnMapping,
  handlePreview,
  handleCancel,
}: IProps) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold">Properties Mapping</h2>
        <p className="text-sm text-muted-foreground">
          Map the CSV columns to the contact properties
        </p>
      </div>
      <div className="flex items-center justify-start mb-3">
        <div className="font-bold w-44">CSV Columns</div>
        <div className="font-bold">Property</div>
      </div>

      {Object.keys(columnMapping)?.map((column) => {
        const currentMapping = columnMapping[column as ContactProperty]

        // Get all properties that are already mapped to other columns
        const mappedProperties = Object.values(columnMapping).filter(
          (prop) => prop && prop !== '' && prop !== currentMapping
        ) as ContactProperty[]

        // Filter properties: show all if not mapped, or show only current selection + unmapped ones
        const availableProperties = CONTACT_PROPERTIES.filter(
          (prop) => !mappedProperties.includes(prop.key) || prop.key === currentMapping
        )

        return (
          <div key={column}>
            <div className="my-3 flex items-center gap-2">
              <div className="w-56">
                <span>{column}</span>
              </div>
              <Select
                value={columnMapping[column as ContactProperty] || '__none__'}
                onValueChange={(value) => {
                  setColumnMapping({
                    ...columnMapping,
                    [column]: value === '__none__' ? '' : value,
                  })
                }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">-- None --</SelectItem>
                  {availableProperties.map((prop) => (
                    <SelectItem key={prop.key} value={prop.key}>
                      {prop.label} {prop.required ? <span className="text-red-500">*</span> : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
          </div>
        )
      })}

      <div className="flex items-center gap-2 justify-end mt-5">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handlePreview}>Preview</Button>
      </div>
    </div>
  )
}
