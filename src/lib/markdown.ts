import { marked, Renderer, type Tokens } from "marked";
import DOMPurify from "dompurify";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Only h1–h3 make it into the table of contents; deeper levels render at
// body size in this design, so listing them would just be noise.
const TOC_MAX_DEPTH = 3;

// Per-render collection state. Renders are synchronous (marked.parse with
// async: false), so module-level collection is safe — both are reset at the
// top of every renderMarkdown call, keeping ids deterministic across
// repeated renders of the same file.
let collectedHeadings: TocItem[] = [];
const usedIds = new Set<string>();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

// Turns rendered inline HTML into the plain text the TOC shows: strips tags
// and decodes every entity in one pass — both the ones marked escapes
// (&amp;, &lt;, …) and the ones written in the source (&nbsp;, &eacute;,
// numeric refs). Parsing into a detached document executes nothing: no
// scripts run and no resources load.
function plainText(html: string): string {
  const body = new DOMParser().parseFromString(html, "text/html").body;
  // An image carries its label in `alt`, which textContent would drop —
  // without this an image-only heading becomes a blank row in the rail.
  for (const image of body.querySelectorAll("img")) {
    image.replaceWith(image.alt);
  }
  return body.textContent ?? "";
}

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

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Fenced/indented code blocks get wrapped in a container with a copy
// button (styled purely in CSS, no inline SVG, so DOMPurify's plain "html"
// profile is enough — no need to also allow the svg profile). The click is
// handled by delegation in Viewer.tsx, since this HTML is inserted via
// dangerouslySetInnerHTML rather than mounted as React elements.
renderer.code = function code({ text, lang }: Tokens.Code): string {
  const langString = lang?.match(/\S*/)?.[0];
  const codeText = `${text.replace(/\n$/, "")}\n`;
  const languageClass = langString ? ` class="language-${escapeHtml(langString)}"` : "";
  return (
    `<div class="code-block">` +
    `<button type="button" class="code-block__copy" aria-label="Copy code"></button>` +
    `<pre><code${languageClass}>${escapeHtml(codeText)}</code></pre>` +
    `</div>\n`
  );
};

// Headings get slug ids so the TOC can link to them. The "h-" prefix keeps
// slugs from ever colliding with document/window properties (e.g. a heading
// named "Location"), which DOMPurify's SANITIZE_DOM guard would otherwise
// strip. Headings deeper than TOC_MAX_DEPTH still get ids (harmless,
// future-proof) but aren't collected.
renderer.heading = function heading(token: Tokens.Heading) {
  const inline = this.parser.parseInline(token.tokens);
  const plain = plainText(inline).trim();
  const base = `h-${slugify(plain) || "section"}`;
  // Suffix until the id is actually free rather than trusting a per-base
  // counter: "Intro" / "Intro" / "Intro 1" would otherwise emit h-intro-1
  // twice, and getElementById only ever finds the first one.
  let id = base;
  let suffix = 1;
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  // A heading with no text at all (a bare image without alt) would render as
  // a focusable row with no accessible name, so it is left out of the TOC —
  // it still gets an id, which costs nothing.
  if (token.depth <= TOC_MAX_DEPTH && plain !== "") {
    collectedHeadings.push({ id, text: plain, level: token.depth });
  }
  return `<h${token.depth} id="${id}">${inline}</h${token.depth}>\n`;
};

marked.setOptions({
  gfm: true,
  breaks: false,
  renderer,
});

/**
 * Converts raw markdown source into sanitized HTML, safe to render with
 * dangerouslySetInnerHTML, plus the h1–h3 headings found along the way
 * (id/text/level) for the table of contents. Runs entirely client-side.
 */
export function renderMarkdown(source: string): { html: string; headings: TocItem[] } {
  collectedHeadings = [];
  usedIds.clear();
  const rawHtml = marked.parse(source, { async: false }) as string;
  const html = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
  return { html, headings: collectedHeadings };
}
