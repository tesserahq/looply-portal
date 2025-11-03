/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormField } from 'core-ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
} from '@remix-run/react'
import { ActionFunctionArgs } from '@remix-run/node'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { redirectWithToast } from '@/utils/toast.server'
import { fetchApi } from '@/libraries/fetch'
import { AppPreloader } from '@/components/misc/AppPreloader'
import { IWaitingList } from '@/types/waiting-list'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { useEffect, useState } from 'react'
import { waitingListSchema } from '@/schemas/waiting-list'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function WaitingListEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const actionData = useActionData<typeof action>()
  const handleApiError = useHandleApiError()
  const { token } = useApp()
  const params = useParams()
  const [waitingList, setWaitingList] = useState<IWaitingList | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorFields, setErrorFields] = useState<any>()

  const fetchWaitingList = async () => {
    if (!token) return

    try {
      const data = await fetchApi(`${apiUrl}/waiting-lists/${params.id}`, token, nodeEnv)

      setWaitingList(data)
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token && params.id) {
      fetchWaitingList()
    }
  }, [token, params.id])

  useEffect(() => {
    if (actionData?.errors) {
      setErrorFields(actionData.errors)
    }
  }, [actionData])

  const isSubmitting = navigation.state === 'submitting'

  if (isLoading) {
    return <AppPreloader />
  }

  if (!waitingList) {
    return (
      <div className="flex h-full animate-slide-up items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Waiting list not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-screen-md animate-slide-up">
      <Card>
        <CardHeader>
          <CardTitle>Edit Waiting List</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="POST">
            <input type="hidden" name="token" value={token!} />
            <FormField
              label="Name"
              name="name"
              autoFocus
              defaultValue={waitingList.name}
              error={errorFields?.name}
            />
            <FormField
              label="Description"
              name="description"
              type="textarea"
              className="mt-3"
              defaultValue={waitingList.description}
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

export async function action({ request, params }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const { name, description, token } = Object.fromEntries(formData)

  const validated = waitingListSchema.safeParse({
    name,
    description,
  })

  if (!validated.success) {
    return Response.json({ errors: validated.error.flatten().fieldErrors })
  }

  try {
    const response = await fetchApi(
      `${apiUrl}/waiting-lists/${params.id}`,
      token.toString(),
      nodeEnv,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: name.toString(),
          description: description?.toString() || '',
        }),
      },
    )

    return redirectWithToast(`/waiting-lists/${response.id}`, {
      type: 'success',
      title: 'Success',
      description: 'Successfully updated waiting list',
    })
  } catch (error: any) {
    const convertError = JSON.parse(error?.message)
    return redirectWithToast(`/waiting-lists/${params.id}/edit`, {
      type: 'error',
      title: 'Error',
      description: `${convertError.status} - ${convertError.error}`,
    })
  }
}
