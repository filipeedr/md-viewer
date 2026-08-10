import { marked, Renderer, type Tokens } from "marked";
import DOMPurify from "dompurify";

// Table cells whose content has no natural word-break point (e.g. "L-01",
// an ID or short code) are marked so they never wrap. Without this, the
// table layout algorithm treats the hyphen as a valid break point and can
// shrink that column down to "L-" / "01", stealing width from other
// columns even when there's plenty of room to spare.
const renderer = new Renderer();
renderer.tablecell = function tablecell(token: Tokens.TableCell) {
  const content = this.parser.parseInline(token.tokens);
  const tag = token.header ? "th" : "td";
  const align = token.align ? ` align="${token.align}"` : "";
  const isAtomic = !/\s/.test(content.replace(/<[^>]*>/g, "").trim());
  const cellClass = isAtomic ? ' class="cell-nowrap"' : "";
  return `<${tag}${align}${cellClass}>${content}</${tag}>\n`;
};

marked.setOptions({
  gfm: true,
  breaks: false,
  renderer,
});

/**
 * Converts raw markdown source into sanitized HTML, safe to render with
 * dangerouslySetInnerHTML. Runs entirely client-side.
 */
export function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
}
