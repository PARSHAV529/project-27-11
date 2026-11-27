/** Escape special regular expression characters for safe MongoDB $regex searches. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
