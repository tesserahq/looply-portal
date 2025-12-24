import { Button } from '@/modules/shadcn/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcn/ui/table'
import { ContactFormData } from '@/resources/queries/contacts/contact.type'
import { CONTACT_PROPERTIES } from '@/routes/main/contacts/imports'
import { cn } from '@shadcn/lib/utils'
import { Loader2 } from 'lucide-react'

interface IProps {
  transformedData: ContactFormData[]
  isLoading: boolean
  onBack: () => void
  onImport: () => Promise<void>
}

export function ImportContactsPreview({ transformedData, isLoading, onBack, onImport }: IProps) {
  return (
    <div className="space-y-4">
      {transformedData.length > 0 && (
        <div className="border-input bg-card dark:bg-navy-800 sticky bottom-0 z-10 mb-2">
          <div className="text-sm text-muted-foreground">
            Preview all {transformedData.length} contacts
          </div>
        </div>
      )}

      <div
        className={cn(
          'border-border bg-card relative flex flex-col overflow-hidden rounded border',
          'h-[calc(100vh-20rem)]'
        )}>
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader
                className="sticky top-0 z-10 w-full bg-slate-100/20 backdrop-blur-md
                  dark:bg-slate-800/50">
                <TableRow className="border-border dark:hover:bg-navy-700">
                  {CONTACT_PROPERTIES.map((prop) => (
                    <TableHead
                      key={prop.key}
                      className="text-navy-800 dark:text-navy-100 py-2 font-semibold
                        whitespace-nowrap">
                      {prop.label}
                      {prop.required && <span className="text-destructive ml-1">*</span>}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white dark:bg-transparent">
                {transformedData.map((contact, index) => (
                  <TableRow
                    key={index}
                    className="dark:border-border dark:hover:bg-navy-600 hover:bg-slate-50">
                    {CONTACT_PROPERTIES.map((prop) => (
                      <TableCell
                        key={prop.key}
                        className="text-navy-800 dark:text-navy-100 py-2 ps-4 whitespace-nowrap">
                        {prop.key === 'is_active'
                          ? contact[prop.key]
                            ? 'Yes'
                            : 'No'
                          : contact[prop.key]?.toString() || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back to Mapping
        </Button>
        <Button onClick={onImport} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>Import {transformedData.length} contacts</>
          )}
        </Button>
      </div>
    </div>
  )
}
