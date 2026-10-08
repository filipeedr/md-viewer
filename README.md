## MlookD**.

A minimal, client-only Markdown (.md) viewer. Drop or choose a `.md` file, or paste text with `Ctrl+V` / `⌘V` and read it fully formatted — nothing is uploaded, saved, or cached. Refreshing the page always returns to a blank slate.

<img width="1824" height="1025" alt="Screenshot 2026-10-08 at 08 45 23" src="https://github.com/user-attachments/assets/fc866abf-ec00-493c-bd3a-0aa0b57fa4e7" />
<img width="1824" height="1025" alt="Screenshot 2026-10-08 at 08 47 11" src="https://github.com/user-attachments/assets/455cf1ea-0fc4-477d-a9ea-bea99d742a64" />

## Stack

React + TypeScript + Vite. Runtime dependencies are kept to the essentials:

- [`marked`](https://github.com/markedjs/marked) — Markdown parsing
- [`dompurify`](https://github.com/cure53/DOMPurify) — sanitizes the generated HTML before it's rendered

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
