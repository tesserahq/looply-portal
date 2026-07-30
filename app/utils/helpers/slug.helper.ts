export const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')

export const generateTemplateAlias = (name: string) => `${slugify(name)}-${Date.now().toString(36)}`
