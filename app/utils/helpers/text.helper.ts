/**
 * Formats a snake_case or kebab-case value into a humanized, title-cased label.
 * e.g. "check_in" -> "Check In"
 */
export function humanizeText(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
