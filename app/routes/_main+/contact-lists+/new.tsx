/* eslint-disable @typescript-eslint/no-explicit-any */
import { useActionData, useNavigate, useNavigation } from '@remix-run/react'
import { ActionFunctionArgs } from '@remix-run/node'
import { redirectWithToast } from '@/utils/toast.server'
import { fetchApi } from '@/libraries/fetch'
import { useEffect, useMemo, useState } from 'react'
import {
  ContactListForm,
  contactListFormSchema,
} from '@/components/form/contact-list-form'

export default function ContactListNew() {
  const navigation = useNavigation()
  const navigate = useNavigate()
  const actionData = useActionData<typeof action>()
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
    <ContactListForm
      errorFields={errorFields}
      isSubmitting={isSubmitting}
      onCancel={() => navigate('/contact-lists')}
    />
  )
}

export async function action({ request }: ActionFunctionArgs) {
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
      `${apiUrl}/contact-lists`,
      token.toString(),
      nodeEnv,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          is_public: is_public === 'true',
        }),
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
