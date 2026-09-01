import { z } from 'zod/v4'

/**
 * Tag form validation schema, shared by create and rename - a tag has only
 * a name.
 */
export const tagFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export type TagFormValue = z.infer<typeof tagFormSchema>

export const defaultTagFormValues: TagFormValue = {
  name: '',
}
