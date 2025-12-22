/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ImportContactsInitial,
  ImportContactsPreview,
  ImportContactsSetProperties,
} from '@/components/import-contacts'
import { useApp } from '@/context/AppContext'
import { Button } from '@/modules/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcn/ui/card'
import { useCreateBatchContacts } from '@/resources/hooks/contacts'
import { ContactFormData } from '@/resources/queries/contacts/contact.type'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { FileText, X } from 'lucide-react'
import { useState } from 'react'
import { IFileInfo } from 'react-csv-reader'
import { toast } from 'sonner'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export type ContactProperty =
  | 'first_name'
  | 'middle_name'
  | 'last_name'
  | 'company'
  | 'job'
  | 'contact_type'
  | 'phone_type'
  | 'phone'
  | 'email'
  | 'website'
  | 'address_line_1'
  | 'address_line_2'
  | 'city'
  | 'state'
  | 'zip_code'
  | 'country'
  | 'notes'
  | 'is_active'

export type IContactPropertyMapping = Partial<Record<string, string>>

export const CONTACT_PROPERTIES: { key: ContactProperty; label: string; required?: boolean }[] = [
  { key: 'first_name', label: 'First Name' },
  { key: 'middle_name', label: 'Middle Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'company', label: 'Company' },
  { key: 'job', label: 'Job Title' },
  { key: 'contact_type', label: 'Contact Type' },
  { key: 'phone_type', label: 'Phone Type' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email', required: true },
  { key: 'website', label: 'Website' },
  { key: 'address_line_1', label: 'Address Line 1' },
  { key: 'address_line_2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip_code', label: 'Zip Code' },
  { key: 'country', label: 'Country' },
  { key: 'notes', label: 'Notes' },
  { key: 'is_active', label: 'Is Active' },
]

const MAX_FILE_SIZE = 500 * 1024 // 500KB in bytes

export default function ImportContactsPage() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const [csvData, setCsvData] = useState<any[]>([])
  const [fileInfo, setFileInfo] = useState<IFileInfo | null>(null)
  const [columnMapping, setColumnMapping] = useState<IContactPropertyMapping>({})
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [transformedData, setTransformedData] = useState<ContactFormData[]>([])

  const config = { apiUrl: apiUrl!, token: token!, nodeEnv }

  const { mutateAsync: createBatchContacts, isPending } = useCreateBatchContacts(config, {
    onSuccess: () => navigate('/contacts'),
  })

  const handleFileLoaded = (data: any[], fileInfo: IFileInfo) => {
    // Validate file size
    if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
      toast.error(
        `File size exceeds the maximum limit of 500KB. Current file size: ${(fileInfo.size / 1024).toFixed(2)}KB`
      )
      setCsvData([])
      setFileInfo(null)
      return
    }

    if (!data || data.length === 0) {
      toast.error('The CSV file appears to be empty or invalid.')
      return
    }

    const columns = Object.keys(data[0])
    setCsvData(data)
    setFileInfo(fileInfo)
    setCurrentStep(1)

    // Auto-map columns if they match contact property names
    const autoMapping: IContactPropertyMapping = {}
    columns.forEach((col) => {
      const normalizedCol = col.toLowerCase().replace(/\W/g, '_')
      const matchingProperty = CONTACT_PROPERTIES.find((prop) => prop.key === normalizedCol)
      if (matchingProperty) {
        autoMapping[matchingProperty.key] = col
      } else {
        autoMapping[col] = ''
      }
    })

    setColumnMapping(autoMapping)
  }

  const handleError = (error: Error) => {
    setCsvData([])
    setFileInfo(null)
    toast.error(error.message)
  }

  const transformDataToContacts = (): ContactFormData[] => {
    return csvData.map((row) => {
      // Initialize all contact fields with default values
      const contact: ContactFormData | any = {
        first_name: '',
        middle_name: '',
        last_name: '',
        company: '',
        job: '',
        contact_type: '',
        phone_type: '',
        phone: '',
        email: '',
        website: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        notes: '',
        is_active: true,
      }

      // Iterate through columnMapping to map CSV columns to contact properties
      Object.entries(columnMapping).forEach(([csvColumn, contactProperty]) => {
        // Skip if no mapping is set
        if (!contactProperty || contactProperty === '') {
          return
        }

        // Get the value from CSV row using the original CSV column name
        const value = row[csvColumn]

        // Handle boolean conversion for is_active
        if (contactProperty === 'is_active') {
          contact['is_active'] = true
        } else {
          // Convert to string for other fields, send empty string if value is empty
          const stringValue = value !== undefined && value !== null ? String(value).trim() : ''
          contact[contactProperty] = stringValue
        }
      })

      return contact
    })
  }

  const handlePreview = async () => {
    const required = CONTACT_PROPERTIES.filter((p) => p.required)
    const missing = required.filter((p) => !columnMapping[p.key])
    if (missing.length) {
      toast.error(`Please map required fields: ${missing.map((m) => m.label).join(', ')}`)
      return
    }

    // Transform the data
    const transformed = transformDataToContacts()

    // Validate that we have at least one contact to import
    if (transformed.length === 0) {
      toast.error('No contacts to import')
      return
    }

    // Display transformed data first
    setTransformedData(transformed)
    setCurrentStep(2)
  }

  const handleImport = async () => {
    try {
      // Transform the data
      const transformed = transformDataToContacts()

      // Send batch request to API
      await createBatchContacts(transformed)
    } catch {}
  }

  const handleCancel = () => {
    setCurrentStep(1)
    setTransformedData([])
    setFileInfo(null)
    setCsvData([])
    setColumnMapping({})
  }

  return (
    <Card className="max-w-screen-md mx-auto">
      <CardHeader>
        <CardTitle>Import Contacts</CardTitle>
        <CardDescription>Import contacts from a CSV file</CardDescription>
      </CardHeader>
      <CardContent>
        {!fileInfo ? (
          <ImportContactsInitial
            onFileLoaded={handleFileLoaded}
            onError={handleError}
            maxFileSize={MAX_FILE_SIZE}
          />
        ) : (
          <div className="space-y-4">
            {currentStep === 1 && (
              <>
                <div className="flex items-center justify-between border-dashed border rounded px-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <span>{fileInfo.name}</span>
                  </div>
                  <Button variant="ghost" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ImportContactsSetProperties
                  columnMapping={columnMapping}
                  setColumnMapping={setColumnMapping}
                  handlePreview={handlePreview}
                  handleCancel={handleCancel}
                />
              </>
            )}

            {currentStep === 2 && transformedData.length > 0 && (
              <ImportContactsPreview
                transformedData={transformedData}
                onBack={() => setCurrentStep(1)}
                onImport={handleImport}
                isLoading={isPending}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
