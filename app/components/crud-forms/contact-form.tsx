import { Button } from '@/modules/shadcn/ui/button'
import { Card, CardContent } from '@/modules/shadcn/ui/card'
import { contactFormSchema, ContactFormValue } from '@/resources/queries/contacts/contact.schema'
import { ContactFormData } from '@/resources/queries/contacts/contact.type'
import { formValuesToContactData } from '@/resources/queries/contacts/contact.utils'
import { useNavigate } from 'react-router'
import { Combobox, type ComboboxOption } from '@shadcn/ui/Combobox'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState as useReactState, useState } from 'react'
import { GetCity, GetCountries, GetState } from 'react-country-state-city'
import { City, Country, State } from 'react-country-state-city/dist/esm/types'
import { Form } from '../form'
import { FormLayout } from '../form/form-layout'

export const contactTypeOptions: ComboboxOption[] = [
  {
    id: 'personal',
    label: 'Personal',
    value: 'personal',
  },
  {
    id: 'business',
    label: 'Business',
    value: 'business',
  },
  {
    id: 'vendor',
    label: 'Vendor',
    value: 'vendor',
  },
  {
    id: 'customer',
    label: 'Customer',
    value: 'customer',
  },
  {
    id: 'partner',
    label: 'Partner',
    value: 'partner',
  },
  {
    id: 'supplier',
    label: 'Supplier',
    value: 'supplier',
  },
  {
    id: 'lead',
    label: 'Lead',
    value: 'lead',
  },
]

export const phoneTypeOptions: ComboboxOption[] = [
  {
    id: 'mobile',
    label: 'Mobile',
    value: 'mobile',
  },
  {
    id: 'home',
    label: 'Home',
    value: 'home',
  },
  {
    id: 'work',
    label: 'Work',
    value: 'work',
  },
]

interface ContactFormProps {
  defaultValues: ContactFormValue
  onSubmit: (data: ContactFormData) => Promise<void> | void
  submitLabel?: string
}

export const ContactForm = ({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
}: ContactFormProps) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [selectedCountry, setSelectedCountry] = useReactState<ComboboxOption<Country>>()
  const [selectedState, setSelectedState] = useReactState<ComboboxOption<State>>()
  const [selectedCity, setSelectedCity] = useReactState<ComboboxOption<City>>()
  const [countries, setCountries] = useReactState<Country[]>([])
  const [states, setStates] = useReactState<ComboboxOption<State>[]>([])
  const [cities, setCities] = useReactState<ComboboxOption<City>[]>([])

  const title = defaultValues?.id ? 'Edit Contact' : 'New Contact'

  const countryOptions: ComboboxOption<Country>[] = useMemo(
    () =>
      countries.map((country) => ({
        id: country.id.toString(),
        label: country.name,
        value: country.id.toString(),
        searchValue: `${country.name} ${country.iso2} ${country.phone_code}`,
        data: country,
      })),
    [countries]
  )

  const getCountries = useCallback(async () => {
    const countriesData = await GetCountries()
    setCountries(countriesData)
  }, [])

  const getStates = useCallback(async () => {
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
  }, [selectedCountry])

  const getCities = useCallback(async () => {
    if (!selectedState?.data?.id) {
      setCities([])
      return
    }

    const values = await GetCity(Number(selectedCountry?.data?.id), Number(selectedState.data.id))
    const mappedCities: ComboboxOption<City>[] = values.map((city) => ({
      id: city.id.toString(),
      label: city.name,
      value: city.id.toString(),
      data: city,
    }))

    setCities(mappedCities)
  }, [selectedState, selectedCountry])

  useEffect(() => {
    getCountries()
  }, [getCountries])

  useEffect(() => {
    getStates()
  }, [getStates])

  useEffect(() => {
    getCities()
  }, [getCities])

  // Initialize country/state/city from defaultValues when editing
  useEffect(() => {
    if (defaultValues?.country && countries.length > 0 && !selectedCountry) {
      const country = countries.find((c) => c.name === defaultValues.country)
      if (country) {
        const countryOption: ComboboxOption<Country> = {
          id: country.id.toString(),
          label: country.name,
          value: country.id.toString(),
          searchValue: `${country.name} ${country.iso2} ${country.phone_code}`,
          data: country,
        }
        setSelectedCountry(countryOption)
      }
    }
  }, [countries, defaultValues?.country, selectedCountry])

  useEffect(() => {
    if (selectedCountry?.data?.id && states.length > 0 && defaultValues?.state && !selectedState) {
      const state = states.find((s) => s.data?.name === defaultValues.state)
      if (state) {
        setSelectedState(state)
      }
    }
  }, [states, selectedCountry?.data?.id, defaultValues?.state, selectedState])

  useEffect(() => {
    if (selectedState?.data?.id && cities.length > 0 && defaultValues?.city && !selectedCity) {
      const city = cities.find((c) => c.data?.name === defaultValues.city)
      if (city) {
        setSelectedCity(city)
      }
    }
  }, [cities, selectedState?.data?.id, defaultValues?.city, selectedCity])

  // Handle form submission
  const handleSubmit = async (data: ContactFormValue) => {
    setIsSubmitting(true)

    try {
      // Include country, state, city from combobox selections
      const formDataWithLocation = {
        ...data,
        country: selectedCountry?.data?.name || data.country || '',
        state: selectedState?.data?.name || data.state || '',
        city: selectedCity?.data?.name || data.city || '',
      }
      const contactData = formValuesToContactData(formDataWithLocation)

      await onSubmit(contactData)
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form schema={contactFormSchema} defaultValues={defaultValues} onSubmit={handleSubmit}>
      <FormLayout title={title}>
        <h2 className="mb-3 text-lg font-medium">General</h2>
        <Card className="shadow-none">
          <CardContent className="space-y-4 pt-4">
            <Form.Email
              field="email"
              label="Email"
              placeholder="Enter email address"
              required
              autoFocus
            />

            <div className="mt-3 grid gap-4 lg:grid-cols-3">
              <Form.Input field="first_name" label="First Name" required />
              <Form.Input field="middle_name" label="Middle Name" />
              <Form.Input field="last_name" label="Last Name" />
            </div>

            <Form.Input field="company" label="Company" />
            <Form.Input field="job" label="Job" />
            <Form.Input field="website" label="Website" placeholder="https://example.com" />

            <div className="mb-3">
              <Form.Select
                field="contact_type"
                label="Contact Type"
                options={contactTypeOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </div>

            <Form.Textarea field="notes" label="Notes" placeholder="Enter notes (optional)" />
          </CardContent>
        </Card>

        <h2 className="mt-5 mb-3 text-lg font-medium">Contact Information</h2>
        <Card className="shadow-none">
          <CardContent className="space-y-4 pt-4">
            <Form.PhoneInput field="phone" label="Phone" placeholder="Enter phone number" />

            <Form.Select
              field="phone_type"
              label="Phone Type"
              options={phoneTypeOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </CardContent>
        </Card>

        <h2 className="mt-5 mb-3 text-lg font-medium">Address</h2>
        <Card className="shadow-none">
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Combobox
                label="Country"
                options={countryOptions}
                value={selectedCountry?.value}
                onChange={(_, option) => setSelectedCountry(option)}
                renderOption={(option) => (
                  <div className="flex items-center gap-2">
                    {option.data?.emoji && <span className="text-base">{option.data.emoji}</span>}
                    <span className="font-medium">{option.label}</span>
                  </div>
                )}
              />
              <Combobox
                label="State"
                options={states}
                value={selectedState?.value}
                disabled={!selectedCountry?.value}
                onChange={(_, option) => setSelectedState(option as ComboboxOption<State>)}
              />
              <Combobox
                label="City"
                options={cities}
                value={selectedCity?.value}
                disabled={!selectedState?.value}
                onChange={(_, option) => setSelectedCity(option as ComboboxOption<City>)}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Form.Input field="address_line_1" label="Address Line 1" />
              <Form.Input field="address_line_2" label="Address Line 2" />
            </div>

            <Form.Input field="zip_code" label="Zip Code" />
          </CardContent>
        </Card>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate('/contacts')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </FormLayout>
    </Form>
  )
}
