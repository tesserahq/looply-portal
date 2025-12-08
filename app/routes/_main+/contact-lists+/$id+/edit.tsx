/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useParams,
} from '@remix-run/react'
import { ActionFunctionArgs } from '@remix-run/node'
import { redirectWithToast } from '@/utils/toast.server'
import { fetchApi } from '@/libraries/fetch'
import { AppPreloader } from '@/components/misc/AppPreloader'
import { IContactList } from '@/types/contact-list'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { useEffect, useState } from 'react'
import {
  ContactListForm,
  contactListFormSchema,
} from '@/components/form/contact-list-form'
import { useApp } from '@/context/AppContext'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactListEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const actionData = useActionData<typeof action>()
  const handleApiError = useHandleApiError()
  const { token } = useApp()
  const params = useParams()
  const [contactList, setContactList] = useState<IContactList | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorFields, setErrorFields] = useState<any>()

  const fetchContactList = async () => {
    if (!token) return

    try {
      const data = await fetchApi(`${apiUrl}/contact-lists/${params.id}`, token, nodeEnv)

      setContactList(data)
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token && params.id) {
      fetchContactList()
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

  if (!contactList) {
    return (
      <div className="flex h-full animate-slide-up items-center justify-center">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">Contact list not found</p>
        </div>
      </div>
    )
  }

  return (
    <ContactListForm
      initialData={contactList}
      errorFields={errorFields}
      isSubmitting={isSubmitting}
      onCancel={() => navigate(`/contact-lists/${params.id}`)}
    />
  )
}

export async function action({ request, params }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const { name, description, is_public, token } = Object.fromEntries(formData)

  const validated = contactListFormSchema.safeParse({
    name,
    description,
    is_public: is_public === 'true',
  })

  if (!validated.success) {
    return Response.json({ errors: validated.error.flatten().fieldErrors })
  }

  try {
    const response = await fetchApi(
      `${apiUrl}/contact-lists/${params.id}`,
      token.toString(),
      nodeEnv,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: name.toString(),
          description: description?.toString() || '',
          is_public: is_public === 'true',
        }),
      },
    )

    return redirectWithToast(`/contact-lists/${response.id}`, {
      type: 'success',
      title: 'Success',
      description: 'Successfully updated contact list',
    })
  } catch (error: any) {
    const convertError = JSON.parse(error?.message)
    return redirectWithToast(`/contact-lists/${params.id}/edit`, {
      type: 'error',
      title: 'Error',
      description: `${convertError.status} - ${convertError.error}`,
    })
  }
}
