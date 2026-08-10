export const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')

export const generateTemplateAlias = (name: string) => `${slugify(name)}-${Date.now().toString(36)}`

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789'

export const generateRandomString = (length = 5) =>
  Array.from({ length }, () => ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)]).join(
    ''
  )
