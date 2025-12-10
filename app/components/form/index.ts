import { Form } from './form'
import { FormProvider } from './form-context'
import { FormDatePicker } from './form-date-picker'
import { FormDateTimePicker } from './form-datetime-picker'
import { FormInput } from './form-input'
import { FormSelect } from './form-select'
import { FormSwitch } from './form-switch'
import { FormTextarea } from './form-textarea'
import { FormEmail } from './form-email'
import { FormPhoneInput } from './form-phone-input'
import { FormCommand } from './form-command'
import { FormContacts } from './form-contacts'
import { FormInteractionActions } from './form-interaction-actions'

const FormCompound = Object.assign(Form, {
  Input: FormInput,
  Textarea: FormTextarea,
  Select: FormSelect,
  Switch: FormSwitch,
  DateTimePicker: FormDateTimePicker,
  DatePicker: FormDatePicker,
  Email: FormEmail,
  PhoneInput: FormPhoneInput,
  Command: FormCommand,
  Contacts: FormContacts,
  InteractionActions: FormInteractionActions,
  Provider: FormProvider,
})

export { FormCompound as Form }
