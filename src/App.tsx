import { useCallback, useEffect, useState } from "react";
import EmptyState from "./components/EmptyState";
import RepoLink from "./components/RepoLink";
import ThemeToggle from "./components/ThemeToggle";
import Viewer from "./components/Viewer";
import { renderClipboardContent, renderMarkdown, type TocItem } from "./lib/markdown";
import { useTheme } from "./lib/theme";

interface LoadedDocument {
  fileName: string;
  html: string;
  headings: TocItem[];
}

export default function App() {
  // Held only in memory — nothing is persisted, so a page refresh always
  // returns to the empty state.
  const [loadedDocument, setLoadedDocument] = useState<LoadedDocument | null>(null);
  const [theme, toggleTheme] = useTheme();

  const handleFileSelected = useCallback(async (file: File) => {
    const text = await file.text();
    const { html, headings } = renderMarkdown(text);
    setLoadedDocument({ fileName: file.name, html, headings });
  }, []);

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement)
    ) {
      return;
    }

    const clipboard = event.clipboardData;
    const text = clipboard?.getData("text/plain") ?? "";
    const html = clipboard?.getData("text/html");
    if (!text && !html) return;

    event.preventDefault();
    const rendered = renderClipboardContent(text, html);
    setLoadedDocument({ fileName: "Pasted text", ...rendered });
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return (
    <>
      {loadedDocument ? (
        <Viewer
          fileName={loadedDocument.fileName}
          html={loadedDocument.html}
          headings={loadedDocument.headings}
          onFileSelected={handleFileSelected}
        />
      ) : (
        <EmptyState onFileSelected={handleFileSelected} />
      )}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <RepoLink />
    </>
  );
}
