// Matches `${content}` and variants with inner whitespace, e.g. `${ content }`.
const CONTENT_PLACEHOLDER = /\$\{\s*content\s*\}/g

/**
 * Substitutes a template's HTML into its layout's `${content}` slot.
 * Falls back to the template HTML alone if the layout has no slot.
 */
export function mergeTemplateIntoLayout(layoutHtml: string, templateHtml: string): string {
  if (!CONTENT_PLACEHOLDER.test(layoutHtml)) return templateHtml
  return layoutHtml.replace(CONTENT_PLACEHOLDER, () => templateHtml)
}
