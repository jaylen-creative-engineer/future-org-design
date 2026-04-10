/** First markdown `#` heading line, or `fallbackPageId` if missing. */
export function titleFromFirstHeading(markdown: string, fallbackPageId: string): string {
  const m = markdown.match(/^#\s+([^\n]+)/m);
  const raw = m?.[1]?.trim();
  return (raw || fallbackPageId).replace(/\s+/g, " ");
}
