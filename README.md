# md-viewer

Live at **[mlookd.com](https://mlookd.com)**.

A minimal, client-only Markdown viewer. Drop or choose a `.md` file and read it fully formatted — nothing is uploaded, saved, or cached. Refreshing the page always returns to a blank slate.

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
