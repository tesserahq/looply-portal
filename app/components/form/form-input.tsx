import { useFormContext } from './form-context'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/modules/shadcn/ui/form'
import { Input } from '@/modules/shadcn/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/modules/shadcn/ui/input-group'
import { ComponentProps } from 'react'

interface FormInputProps extends Omit<ComponentProps<typeof Input>, 'name'> {
  field: string
  label?: string
  description?: string
  required?: boolean
  hideError?: boolean
  rules?: {
    required?: boolean | string
    min?: number | { value: number; message: string }
    max?: number | { value: number; message: string }
    minLength?: number | { value: number; message: string }
    maxLength?: number | { value: number; message: string }
    pattern?: RegExp | { value: RegExp; message: string }
    validate?: (value: unknown) => boolean | string | Promise<boolean | string>
  }
  addon?: {
    icon: React.ReactNode
    position?: 'left' | 'right'
  }
}

export const FormInput = ({
  field,
  label,
  description,
  required,
  hideError = false,
  rules,
  addon,
  ...props
}: FormInputProps) => {
  const { form } = useFormContext()

  return (
    <FormField
      control={form.control}
      name={field}
      rules={{
        ...rules,
        ...(required && {
          required: required === true ? 'This field is required' : required,
        }),
      }}
      render={({ field: fieldProps }) => (
        <FormItem>
          {label && (
            <FormLabel
              className={
                required ? 'after:ml-0.5 after:text-destructive after:content-["*"]' : ''
              }>
              {label}
            </FormLabel>
          )}
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            {addon ? (
              <InputGroup className="rounded-sm border-none bg-gray-100">
                <InputGroupInput {...fieldProps} {...props} />
                {addon && (
                  <InputGroupAddon
                    align={addon?.position === 'right' ? 'inline-end' : 'inline-start'}>
                    {addon?.icon}
                  </InputGroupAddon>
                )}
              </InputGroup>
            ) : (
              <Input {...fieldProps} {...props} />
            )}
          </FormControl>
          {!hideError && <FormMessage />}
        </FormItem>
      )}
    />
  )
}
