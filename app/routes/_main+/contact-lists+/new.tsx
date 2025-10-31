/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormField } from 'core-ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, useActionData, useNavigation } from '@remix-run/react'
import { ActionFunctionArgs } from '@remix-run/node'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { redirectWithToast } from '@/utils/toast.server'
import { fetchApi } from '@/libraries/fetch'
import { useEffect, useMemo, useState } from 'react'
import { contactListSchema } from '@/schemas/contact-list'

export default function ContactListNew() {
  const navigation = useNavigation()
  const actionData = useActionData<typeof action>()
  const { token } = useApp()
  const [errorFields, setErrorFields] = useState<any>()

  useEffect(() => {
    if (actionData?.errors) {
      setErrorFields(actionData.errors)
    }
  }, [actionData])

  const isSubmitting = useMemo(
    () => navigation.state === 'submitting',
    [navigation.state],
  )

  return (
    <div className="mx-auto w-full max-w-screen-md animate-slide-up">
      <Card>
        <CardHeader>
          <CardTitle>New Contact List</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="POST">
            <input type="hidden" name="token" value={token!} />
            <FormField label="Name" name="name" autoFocus error={errorFields?.name} />
            <FormField
              label="Description"
              name="description"
              type="textarea"
              className="mt-3"
              error={errorFields?.description}
            />

            <div className="mt-10 flex justify-end">
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

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const { name, description, token } = Object.fromEntries(formData)

  const validated = contactListSchema.safeParse({
    name,
    description,
  })

  if (!validated.success) {
    return Response.json({ errors: validated.error.flatten().fieldErrors })
  }

  try {
    const response = await fetchApi(
      `${apiUrl}/contact-lists`,
      token.toString(),
      nodeEnv,
      {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      },
    )

    return redirectWithToast(`/contact-lists/${response.id}`, {
      type: 'success',
      title: 'Success',
      description: 'Successfully created contact list',
    })
  } catch (error: any) {
    const convertError = JSON.parse(error?.message)
    return redirectWithToast('/contact-lists/new', {
      type: 'error',
      title: 'Error',
      description: `${convertError.status} - ${convertError.error}`,
    })
  }
}
