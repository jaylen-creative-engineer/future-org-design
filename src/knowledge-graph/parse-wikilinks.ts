import type { WikiLinkTarget } from "./types.js";

/** Remove fenced and inline code so `[[not-a-link]]` in prose does not count as a wikilink. */
export function stripCodeFromMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ");
}

/**
 * Extract Obsidian-style wikilinks from markdown body.
 * Supports `[[page]]` and `[[page#Heading]]`; ignores leading/trailing space inside brackets.
 * Skips fenced code blocks and inline `` `code` `` spans.
 */
export function parseWikiLinks(markdown: string): WikiLinkTarget[] {
  return parseWikiLinksInPlainText(stripCodeFromMarkdown(markdown));
}

function parseWikiLinksInPlainText(markdown: string): WikiLinkTarget[] {
  const out: WikiLinkTarget[] = [];
  const re = /\[\[([^\]]+)]]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const inner = m[1].trim();
    const hash = inner.indexOf("#");
    let pageId: string;
    let headingAnchor: string | undefined;
    if (hash >= 0) {
      pageId = inner.slice(0, hash).trim();
      const rest = inner.slice(hash + 1).trim();
      headingAnchor = rest || undefined;
    } else {
      pageId = inner;
      headingAnchor = undefined;
    }
    if (pageId) out.push({ pageId, headingAnchor });
  }
  return out;
}
