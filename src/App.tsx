import { useCallback, useState } from "react";
import EmptyState from "./components/EmptyState";
import RepoLink from "./components/RepoLink";
import ThemeToggle from "./components/ThemeToggle";
import Viewer from "./components/Viewer";
import { renderMarkdown, type TocItem } from "./lib/markdown";
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
