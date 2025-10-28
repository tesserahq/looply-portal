/* eslint-disable @typescript-eslint/no-explicit-any */
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import { useEffect, useMemo, useState } from 'react'
import { GetCountries, GetState, GetCity } from 'react-country-state-city'
import { Country, State, City } from 'react-country-state-city/dist/esm/types'
import { FormField } from 'core-ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFetcher, useLoaderData, useParams } from '@remix-run/react'
import { ActionFunctionArgs } from '@remix-run/node'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { redirectWithToast } from '@/utils/toast.server'
import { fetchApi } from '@/libraries/fetch'
import InputEmail from '@/components/misc/InputEmail'
import { AppPreloader } from '@/components/misc/AppPreloader'
import { IContact } from '@/types/contact'
import { useHandleApiError } from '@/hooks/useHandleApiError'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const handleApiError = useHandleApiError()
  const { token } = useApp()
  const params = useParams()
  const [selectedCountry, setSelectedCountry] = useState<ComboboxOption<Country>>()
  const [selectedState, setSelectedState] = useState<ComboboxOption<State>>()
  const [selectedCity, setSelectedCity] = useState<ComboboxOption<City>>()
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<ComboboxOption<State>[]>([])
  const [cities, setCities] = useState<ComboboxOption<City>[]>([])
  const [errorEmail, setErrorEmail] = useState<string>('error')
  const [contact, setContact] = useState<IContact | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isInitializing, setIsInitializing] = useState<boolean>(true)

  const fetchContact = async () => {
    if (!token) return

    try {
      const data = await fetchApi(`${apiUrl}/contacts/${params.id}`, token, nodeEnv)
      setContact(data)
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token && params.id) {
      fetchContact()
    }
  }, [token, params.id])

  const isSubmitting = useMemo(() => fetcher.state === 'submitting', [fetcher.state])

  const countryOptions: ComboboxOption<Country>[] = useMemo(
    () =>
      countries.map((country) => ({
        id: country.id.toString(),
        label: country.name,
        value: country.id.toString(),
        searchValue: `${country.name} ${country.iso2} ${country.phone_code}`,
        data: country,
      })),
    [countries],
  )

  const getCountries = async () => {
    const countriesData = await GetCountries()
    setCountries(countriesData)
  }

  const getStates = async () => {
    if (!selectedCountry?.data?.id) {
      setStates([])
      return
    }

    const values = await GetState(Number(selectedCountry.data.id))
    const mappedStates: ComboboxOption<State>[] = values.map((state) => ({
      id: state.id.toString(),
      label: state.name,
      value: state.id.toString(),
      data: state,
    }))

    setStates(mappedStates)
  }

  const getCities = async () => {
    if (!selectedState?.data?.id) {
      setCities([])
      return
    }

    const values = await GetCity(
      Number(selectedCountry?.data?.id),
      Number(selectedState.data.id),
    )
    const mappedCities: ComboboxOption<City>[] = values.map((city) => ({
      id: city.id.toString(),
      label: city.name,
      value: city.id.toString(),
      data: city,
    }))

    setCities(mappedCities)
  }

  useEffect(() => {
    if (!isLoading && contact) {
      getCountries().then(() => {
        if (!contact.country) {
          setIsInitializing(false)
        }
      })
    }
  }, [isLoading, contact])

  useEffect(() => {
    if (countries.length > 0 && contact?.country && !selectedCountry) {
      const country = countries.find((c) => c.name === contact.country)
      if (country) {
        const countryOption: ComboboxOption<Country> = {
          id: country.id.toString(),
          label: country.name,
          value: country.id.toString(),
          searchValue: `${country.name} ${country.iso2} ${country.phone_code}`,
          data: country,
        }
        setSelectedCountry(countryOption)
      } else {
        setIsInitializing(false)
      }
    }
  }, [countries, contact?.country, selectedCountry])

  useEffect(() => {
    if (selectedCountry?.data?.id) {
      getStates().then(() => {
        if (!contact?.state) {
          setIsInitializing(false)
        }
      })
    }
  }, [selectedCountry?.data?.id, contact?.state])

  useEffect(() => {
    if (
      selectedCountry?.data?.id &&
      states.length > 0 &&
      contact?.state &&
      !selectedState
    ) {
      const state = states.find((s) => s.data?.name === contact.state)
      if (state) {
        setSelectedState(state)
      } else {
        setIsInitializing(false)
      }
    }
  }, [states, selectedCountry?.data?.id, contact?.state, selectedState])

  useEffect(() => {
    if (selectedState?.data?.id) {
      getCities().then(() => {
        if (!contact?.city) {
          setIsInitializing(false)
        }
      })
    }
  }, [selectedState?.data?.id, contact?.city])

  useEffect(() => {
    if (selectedState?.data?.id && cities.length > 0) {
      if (contact?.city && !selectedCity) {
        const city = cities.find((c) => c.data?.name === contact.city)
        if (city) {
          setSelectedCity(city)
        }
      }
      setIsInitializing(false)
    }
  }, [cities, selectedState?.data?.id, contact?.city, selectedCity])

  useEffect(() => {
    if (!isInitializing && errorEmail === 'error') {
      setErrorEmail('')
    }
  }, [isInitializing, errorEmail])

  if (isLoading || isInitializing) {
    return <AppPreloader className="min-h-screen" />
  }

  if (!contact) {
    return (
      <div className="flex h-full animate-slide-up items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Contact not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-screen-md animate-slide-up">
      <Card>
        <CardHeader>
          <CardTitle>Edit Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <fetcher.Form method="POST">
            <input type="hidden" name="token" value={token!} />
            <input type="hidden" name="country" value={selectedCountry?.data?.name} />
            <input type="hidden" name="state" value={selectedState?.data?.name} />
            <input type="hidden" name="city" value={selectedCity?.data?.name} />
            <h2 className="mb-3 text-lg font-medium">General</h2>
            <Card className="shadow-none">
              <CardContent className="pt-4">
                <InputEmail
                  required
                  defaultValue={contact.email}
                  errorMessage={
                    (fetcher.data as { errors?: { email?: string } })?.errors?.email || ''
                  }
                  callbackError={setErrorEmail}
                />
                <div className="mt-3 grid gap-4 lg:grid-cols-3">
                  <FormField
                    label="First Name"
                    name="first_name"
                    defaultValue={contact.first_name}
                  />
                  <FormField
                    label="Middle Name"
                    name="middle_name"
                    defaultValue={contact.middle_name}
                  />
                  <FormField
                    label="Last Name"
                    name="last_name"
                    defaultValue={contact.last_name}
                  />
                </div>
                <FormField
                  label="Company"
                  name="company"
                  defaultValue={contact.company}
                />
                <FormField label="Job" name="job" defaultValue={contact.job} />
                <FormField
                  label="Website"
                  name="website"
                  defaultValue={contact.website}
                />
                <FormField
                  label="Notes"
                  name="notes"
                  type="textarea"
                  defaultValue={contact.notes}
                />
              </CardContent>
            </Card>

            <h2 className="mb-3 mt-5 text-lg font-medium">Contact Information</h2>
            <Card className="shadow-none">
              <CardContent className="pt-4">
                <FormField label="Phone" name="phone" defaultValue={contact.phone} />
                <FormField
                  label="Contact Type"
                  name="contact_type"
                  defaultValue={contact.contact_type}
                />
                <FormField
                  label="Phone Type"
                  name="phone_type"
                  defaultValue={contact.phone_type}
                />
              </CardContent>
            </Card>

            <h2 className="mb-3 mt-5 text-lg font-medium">Address</h2>
            <Card className="shadow-none">
              <CardContent className="pt-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <Combobox
                    label="Countries"
                    options={countryOptions}
                    value={selectedCountry?.value}
                    onChange={(_, option) => setSelectedCountry(option)}
                    renderOption={(option) => (
                      <div className="flex items-center gap-2">
                        {option.data?.emoji && (
                          <span className="text-base">{option.data.emoji}</span>
                        )}
                        <span className="font-medium">{option.label}</span>
                      </div>
                    )}
                  />
                  <Combobox
                    label="States"
                    options={states}
                    value={selectedState?.value}
                    emptyText="Select country first"
                    onChange={(_, option) =>
                      setSelectedState(option as ComboboxOption<State>)
                    }
                  />
                  <Combobox
                    label="Cities"
                    options={cities}
                    value={selectedCity?.value}
                    emptyText="Select state first"
                    onChange={(_, option) =>
                      setSelectedCity(option as ComboboxOption<City>)
                    }
                  />
                </div>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <FormField
                    label="Address Line 1"
                    name="address_line_1"
                    defaultValue={contact.address_line_1}
                  />
                  <FormField
                    label="Address Line 2"
                    name="address_line_2"
                    defaultValue={contact.address_line_2}
                  />
                </div>

                <FormField
                  label="Zip Code"
                  name="zip_code"
                  defaultValue={contact.zip_code}
                />
              </CardContent>
            </Card>

            <div className="mt-10 flex justify-end">
              <Button type="submit" disabled={isSubmitting || errorEmail !== ''}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </fetcher.Form>
        </CardContent>
      </Card>
    </div>
  )
}

export async function action({ request, params }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV
  const formData = await request.formData()
  const { token, ...restOfData } = Object.fromEntries(formData)

  try {
    const response = await fetchApi(
      `${apiUrl}/contacts/${params.id}`,
      token.toString(),
      nodeEnv,
      {
        method: 'PUT',
        body: JSON.stringify(restOfData),
      },
    )

    return redirectWithToast(`/contacts/${response.id}`, {
      type: 'success',
      title: 'Success',
      description: 'Successfully updated contact',
    })
  } catch (error: any) {
    const convertError = JSON.parse(error?.message)
    return redirectWithToast(`/contacts/${params.id}/edit`, {
      type: 'error',
      title: 'Error',
      description: `${convertError.status} - ${convertError.error}`,
    })
  }
}
