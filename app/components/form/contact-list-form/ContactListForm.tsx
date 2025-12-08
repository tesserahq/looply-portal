/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormField } from 'core-ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@remix-run/react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { IContactList } from '@/types/contact-list'

interface ContactListFormProps {
  initialData?: IContactList | null
  errorFields?: any
  isSubmitting?: boolean
  onCancel?: () => void
}

export const ContactListForm = ({
  initialData,
  errorFields,
  isSubmitting = false,
  onCancel,
}: ContactListFormProps) => {
  const { token } = useApp()
  const [isPublic, setIsPublic] = useState<boolean>(initialData?.is_public || false)

  useEffect(() => {
    if (initialData) {
      setIsPublic(initialData.is_public || false)
    }
  }, [initialData])

  const title = initialData ? 'Edit Contact List' : 'New Contact List'

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-md animate-slide-up">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="POST">
            <input type="hidden" name="token" value={token!} />
            <input type="hidden" name="is_public" value={isPublic ? 'true' : 'false'} />
            <FormField
              label="Name"
              name="name"
              autoFocus
              defaultValue={initialData?.name}
              error={errorFields?.name}
            />
            <FormField
              label="Description"
              name="description"
              type="textarea"
              className="mt-3"
              defaultValue={initialData?.description}
              error={errorFields?.description}
            />

            <div className="mt-6 flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked)}
              />
              <Label
                htmlFor="is_public"
                className="mb-0 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Public
              </Label>
            </div>

            <div className="mt-10 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
