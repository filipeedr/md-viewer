import { useCallback, useState } from "react";
import EmptyState from "./components/EmptyState";
import Viewer from "./components/Viewer";
import { renderMarkdown } from "./lib/markdown";

interface LoadedDocument {
  fileName: string;
  html: string;
}

export default function App() {
  // Held only in memory — nothing is persisted, so a page refresh always
  // returns to the empty state.
  const [loadedDocument, setLoadedDocument] = useState<LoadedDocument | null>(null);

  const handleFileSelected = useCallback(async (file: File) => {
    const text = await file.text();
    const html = renderMarkdown(text);
    setLoadedDocument({ fileName: file.name, html });
  }, []);

  if (loadedDocument) {
    return (
      <Viewer
        fileName={loadedDocument.fileName}
        html={loadedDocument.html}
        onFileSelected={handleFileSelected}
      />
    );
  }

  return <EmptyState onFileSelected={handleFileSelected} />;
}
