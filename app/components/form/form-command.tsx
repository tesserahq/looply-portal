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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/modules/shadcn/ui/command'
import { Dialog, DialogContent } from '@/modules/shadcn/ui/dialog'
import { Button } from '@/modules/shadcn/ui/button'
import { CheckIcon, ChevronsUpDownIcon, Loader2 } from 'lucide-react'
import { ComponentProps, useState, type ReactNode } from 'react'
import { cn } from '@/utils/misc'
import { type DialogProps } from '@radix-ui/react-dialog'

export interface CommandOption {
  value: string
  label: string
  disabled?: boolean
  searchValue?: string
}

// Custom CommandDialog that supports Command props
interface CustomCommandDialogProps extends DialogProps {
  commandValue?: string
  onCommandValueChange?: (value: string) => void
  children: ReactNode
}

const CommandDialog = ({
  commandValue,
  onCommandValueChange,
  children,
  ...dialogProps
}: CustomCommandDialogProps) => {
  return (
    <Dialog {...dialogProps}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command
          value={commandValue}
          onValueChange={onCommandValueChange}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

interface CommandSelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  options: CommandOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  isLoading?: boolean
  searchable?: boolean
  disabled?: boolean
  searchValue?: string
  onSearchChange?: (search: string) => void
  dialogProps?: Omit<
    ComponentProps<typeof CommandDialog>,
    'commandValue' | 'onCommandValueChange' | 'children'
  >
}

const CommandSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  isLoading = false,
  searchable = true,
  disabled = false,
  searchValue,
  onSearchChange,
  dialogProps,
}: CommandSelectProps) => {
  const [open, setOpen] = useState(false)

  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (currentValue: string) => {
    const selected = options.find(
      (option) =>
        (option.searchValue ?? option.label).toLowerCase() === currentValue.toLowerCase(),
    )

    if (selected) {
      onChange(selected.value === value ? undefined : selected.value)
    }
    setOpen(false)
  }

  const handleSearchChange = (search: string) => {
    onSearchChange?.(search)
  }

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={isLoading || disabled}
        onClick={() => setOpen(true)}
        className="w-full justify-between rounded bg-transparent">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : selectedOption ? (
          <span className="truncate">{selectedOption.label}</span>
        ) : (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        commandValue={searchValue}
        onCommandValueChange={handleSearchChange}
        {...dialogProps}>
        {searchable && (
          <CommandInput placeholder={searchPlaceholder} disabled={isLoading} />
        )}
        <CommandList>
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup>
            {options.map((option) => {
              const isSelected = value === option.value
              const optionSearchValue = option.searchValue ?? option.label

              return (
                <CommandItem
                  key={option.value}
                  value={optionSearchValue}
                  disabled={option.disabled}
                  className={cn(
                    'cursor-pointer text-base capitalize hover:bg-slate-300/20 dark:hover:bg-navy-300/20',
                    isSelected && 'bg-accent',
                    option.disabled && 'cursor-not-allowed opacity-50',
                  )}
                  onSelect={handleSelect}>
                  <CheckIcon
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      isSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

interface FormCommandProps
  extends Omit<
    ComponentProps<typeof CommandDialog>,
    'commandValue' | 'onCommandValueChange' | 'children'
  > {
  field: string
  label?: string
  description?: string
  required?: boolean
  hideError?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  options: CommandOption[]
  isLoading?: boolean
  searchable?: boolean
  searchValue?: string
  onSearchChange?: (search: string) => void
  rules?: {
    required?: boolean | string
    validate?: (value: unknown) => boolean | string | Promise<boolean | string>
  }
}

export const FormCommand = ({
  field,
  label,
  description,
  required,
  hideError = false,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  options,
  isLoading = false,
  searchable = true,
  searchValue,
  onSearchChange,
  rules,
  ...dialogProps
}: FormCommandProps) => {
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
            <CommandSelect
              value={fieldProps.value}
              onChange={fieldProps.onChange}
              options={options}
              placeholder={placeholder}
              searchPlaceholder={searchPlaceholder}
              emptyText={emptyText}
              isLoading={isLoading}
              searchable={searchable}
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              dialogProps={dialogProps}
            />
          </FormControl>
          {!hideError && <FormMessage />}
        </FormItem>
      )}
    />
  )
}
