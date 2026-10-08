## MlookD**.

A minimal, client-side Markdown (.md) viewer. Drop or choose a `.md` file, or paste text with `Ctrl+V` / `⌘V` and read it fully formatted. Markdown content is never uploaded, saved, or cached; page view analytics are sent to PostHog. Refreshing the page always returns to a blank slate.

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

## Analytics

The app sends page views to PostHog Cloud. It does not capture clicks automatically or record
sessions. The Markdown file contents are never sent to PostHog.

For local builds, set `VITE_POSTHOG_PROJECT_TOKEN` and optionally `VITE_POSTHOG_HOST` in `.env.local`.
For GitHub Pages deployments, add these as Actions variables in the repository settings. The
project token is a public browser token; do not use a personal API key or secret.
