import { z } from 'zod'

const invalid_type_error = 'We expect a string here'

export const contactListFormSchema = z.object({
  name: z
    .string({ invalid_type_error, required_error: "Name can't be blank" })
    .min(1, 'Name is required'),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
})

export type ContactListFormSchema = z.infer<typeof contactListFormSchema>

