import { useFormContext } from './form-context'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/modules/shadcn/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcn/ui/select'
import { Input } from '@/modules/shadcn/ui/input'
import { Loader2 } from 'lucide-react'
import { ComponentProps, useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { useContactInteractionActions } from '@/resources/hooks/contact-interactions'
import { ContactInteractionActionType } from '@/resources/queries/contact-interactions'
import { NodeENVType } from '@/libraries/fetch'
import { type SelectOption } from './form-select'

interface FormInteractionActionsProps extends Omit<
  ComponentProps<typeof Select>,
  'name' | 'value' | 'onValueChange'
> {
  field: string
  label?: string
  description?: string
  required?: boolean
  hideError?: boolean
  placeholder?: string
  apiUrl: string
  token: string
  nodeEnv: NodeENVType
  customActionField?: string
  customActionLabel?: string
  customActionPlaceholder?: string
  rules?: {
    required?: boolean | string
    validate?: (value: unknown) => boolean | string | Promise<boolean | string>
  }
}

export const FormInteractionActions = ({
  field,
  label,
  description,
  required,
  hideError = false,
  placeholder = 'Select an action',
  apiUrl,
  token,
  nodeEnv,
  customActionField = 'custom_action_description',
  customActionLabel = 'Action Description',
  customActionPlaceholder = 'Describe the custom action',
  rules,
  ...props
}: FormInteractionActionsProps) => {
  const { form } = useFormContext()

  // Get contact interaction actions
  const { data: actions, isLoading: isLoadingActions } = useContactInteractionActions({
    apiUrl,
    token,
    nodeEnv,
  })

  // Watch the action field to show/hide custom action input
  const selectedAction = useWatch({
    control: form.control,
    name: field,
  })

  const isCustomAction = selectedAction === 'custom'

  // Transform actions to SelectOption format and sort alphabetically
  const actionOptions: SelectOption[] = useMemo(() => {
    if (!actions?.items) return []

    // Sort actions alphabetically by label
    const sortedItems = [...actions.items].sort((a, b) => a.label.localeCompare(b.label))

    // Check if 'custom' option already exists
    const hasCustom = sortedItems.some((item) => item.value === 'custom')

    // Map to SelectOption format
    const options = sortedItems.map((action: ContactInteractionActionType) => ({
      value: action.value,
      label: action.label,
    }))

    // Add 'custom' option if it doesn't exist
    if (!hasCustom) {
      options.push({
        value: 'custom',
        label: 'Custom',
      })
    }

    // Sort again to ensure 'custom' is in alphabetical position
    return options.sort((a, b) => a.label.localeCompare(b.label))
  }, [actions])

  return (
    <>
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
                  required ? 'after:text-destructive after:ml-0.5 after:content-["*"]' : ''
                }>
                {label}
              </FormLabel>
            )}
            {description && <FormDescription>{description}</FormDescription>}
            <FormControl>
              <Select
                value={fieldProps.value}
                onValueChange={fieldProps.onChange}
                disabled={isLoadingActions || props.disabled}
                {...props}>
                <SelectTrigger>
                  {isLoadingActions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SelectValue placeholder={placeholder} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            {!hideError && <FormMessage />}
          </FormItem>
        )}
      />

      {/* Show custom action description input when 'custom' is selected */}
      {isCustomAction && (
        <FormField
          control={form.control}
          name={customActionField}
          render={({ field: fieldProps }) => (
            <FormItem>
              {customActionLabel && <FormLabel>{customActionLabel}</FormLabel>}
              <FormControl>
                <Input
                  {...fieldProps}
                  placeholder={customActionPlaceholder}
                  value={fieldProps.value || ''}
                />
              </FormControl>
              {!hideError && <FormMessage />}
            </FormItem>
          )}
        />
      )}
    </>
  )
}
