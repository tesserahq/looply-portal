import { forwardRef, useState } from 'react'
import { useFormContext } from './form-context'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { Input } from '@shadcn/ui/input'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shadcn/ui/form'
import { cn } from '@/utils/misc'

interface FormPhoneInputProps {
  field: string
  label?: string
  description?: string
  required?: boolean | string
  placeholder?: string
  className?: string
}

export const FormPhoneInput = forwardRef<HTMLInputElement, FormPhoneInputProps>(
  ({ field, label, description, required, placeholder, className }, ref) => {
    const { form } = useFormContext()
    const [phoneError, setPhoneError] = useState<string | null>(null)

    return (
      <FormField
        control={form.control}
        name={field}
        rules={{
          ...(required && {
            required: required === true ? 'Phone number is required' : required,
          }),
          validate: (value: string | undefined) => {
            if (!value || value.trim() === '') {
              if (required) {
                return 'Phone number is required'
              }
              return true
            }
            if (!isValidPhoneNumber(value)) {
              return 'Please enter a valid phone number'
            }
            return true
          },
        }}
        render={({ field: fieldProps }) => (
          <FormItem>
            {label && (
              <FormLabel
                className={
                  required
                    ? 'after:ml-0.5 after:text-destructive after:content-["*"]'
                    : ''
                }>
                {label}
              </FormLabel>
            )}
            {description && <FormDescription>{description}</FormDescription>}
            <FormControl>
              <div className="relative">
                <PhoneInput
                  {...fieldProps}
                  international
                  value={fieldProps.value || undefined}
                  onChange={(value) => {
                    fieldProps.onChange(value || '')
                    if (value && !isValidPhoneNumber(value)) {
                      setPhoneError('Please enter a valid phone number')
                    } else {
                      setPhoneError(null)
                    }
                  }}
                  inputComponent={Input}
                  numberInputProps={{
                    name: field,
                    id: field,
                    ref,
                    placeholder,
                    className: cn(
                      'flex h-10 w-full rounded-md border border-input bg-transparent py-2 pl-3 pr-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-primary-foreground md:text-sm',
                      form.formState.errors[field] && 'border-destructive',
                      className,
                    ),
                  }}
                />
              </div>
            </FormControl>
            <FormMessage />
            {phoneError && !form.formState.errors[field] && (
              <p className="text-sm font-medium text-destructive">{phoneError}</p>
            )}
          </FormItem>
        )}
      />
    )
  },
)

FormPhoneInput.displayName = 'FormPhoneInput'
