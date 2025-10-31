/* eslint-disable @typescript-eslint/no-explicit-any */
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { GetCountries, GetState, GetCity } from 'react-country-state-city'
import { Country, State, City } from 'react-country-state-city/dist/esm/types'
import { FormField } from 'core-ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, useLoaderData, useNavigation, useParams } from '@remix-run/react'
import { ActionFunctionArgs } from '@remix-run/node'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { redirectWithToast } from '@/utils/toast.server'
import { fetchApi } from '@/libraries/fetch'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import InputEmail from '@/components/misc/InputEmail'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppPreloader } from '@/components/misc/AppPreloader'
import { IContact } from '@/types/contact'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { contactTypeOptions, phoneTypeOptions } from '../new'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactEdit() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
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
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>(undefined)
  const [contactType, setContactType] = useState<string | undefined>(undefined)
  const [phoneType, setPhoneType] = useState<string | undefined>(undefined)
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

  const isSubmitting = useMemo(
    () => navigation.state === 'submitting',
    [navigation.state],
  )

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

  const handlePhoneChange = useCallback((phone: string | undefined) => {
    if (phone && isValidPhoneNumber(phone)) {
      setPhoneNumber(phone)
      setPhoneError(null)
    } else if (phone === undefined) {
      setPhoneError(null)
    } else {
      setPhoneError('Please enter valid phone number')
    }
  }, [])

  const disabledSave = useMemo(() => {
    return isSubmitting || errorEmail !== '' || phoneError
  }, [isSubmitting, errorEmail, phoneError])

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

  useEffect(() => {
    if (contact?.phone && !phoneNumber) {
      setPhoneNumber(contact.phone)
    }
  }, [contact?.phone, phoneNumber])

  useEffect(() => {
    if (contact?.contact_type && !contactType) {
      setContactType(contact.contact_type)
    }
  }, [contact?.contact_type, contactType])

  useEffect(() => {
    if (contact?.phone_type && !phoneType) {
      setPhoneType(contact.phone_type)
    }
  }, [contact?.phone_type, phoneType])

  useEffect(() => {
    getStates()
  }, [selectedCountry])

  useEffect(() => {
    getCities()
  }, [selectedState])

  if (isLoading || isInitializing) {
    return <AppPreloader />
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
          <Form method="PUT">
            <input type="hidden" name="token" value={token!} />
            <input type="hidden" name="country" value={selectedCountry?.data?.name} />
            <input type="hidden" name="state" value={selectedState?.data?.name} />
            <input type="hidden" name="city" value={selectedCity?.data?.name} />
            <input type="hidden" name="phone" value={phoneNumber} />
            <input type="hidden" name="contact_type" value={contactType || ''} />
            <input type="hidden" name="phone_type" value={phoneType || ''} />
            <h2 className="mb-3 text-lg font-medium">General</h2>
            <Card className="shadow-none">
              <CardContent className="pt-4">
                <InputEmail
                  required
                  defaultValue={contact.email}
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
                <Combobox
                  label="Contact Type"
                  options={contactTypeOptions}
                  value={contactType}
                  className="mb-3"
                  onChange={(value) => setContactType(value)}
                  searchable={false}
                  renderOption={(option) => (
                    <span className="text-sm">{option.label}</span>
                  )}
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
                <div className="mb-3">
                  <Label>Phone</Label>
                  <PhoneInput
                    international
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    inputComponent={Input}
                    numberInputProps={{
                      name: 'phone',
                      id: 'phone',
                      className: `${phoneError ? 'input-error' : ''}`,
                    }}
                    className="flex h-10 w-full rounded bg-transparent py-2 pl-3 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-primary-foreground md:text-sm"
                  />
                  {phoneError && (
                    <p className="mt-1 text-xs text-red-500">{phoneError}</p>
                  )}
                </div>
                <Combobox
                  label="Phone Type"
                  options={phoneTypeOptions}
                  value={phoneType}
                  onChange={(value) => setPhoneType(value)}
                  searchable={false}
                  renderOption={(option) => (
                    <span className="text-sm">{option.label}</span>
                  )}
                />
              </CardContent>
            </Card>

            <h2 className="mb-3 mt-5 text-lg font-medium">Address</h2>
            <Card className="shadow-none">
              <CardContent className="pt-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <Combobox
                    label="Country"
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
                    label="State"
                    options={states}
                    value={selectedState?.value}
                    disabled={!selectedCountry?.value}
                    onChange={(_, option) =>
                      setSelectedState(option as ComboboxOption<State>)
                    }
                  />
                  <Combobox
                    label="City"
                    options={cities}
                    value={selectedCity?.value}
                    disabled={!selectedState?.value}
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
              <Button type="submit" disabled={disabledSave as boolean}>
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
