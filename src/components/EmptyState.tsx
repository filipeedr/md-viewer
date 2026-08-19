import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { isMarkdownFile } from "../lib/file";

interface EmptyStateProps {
  onFileSelected: (file: File) => void;
}

export default function EmptyState({ onFileSelected }: EmptyStateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      if (!isMarkdownFile(file)) {
        setError("Please choose a .md file.");
        return;
      }
      setError(null);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      processFile(event.dataTransfer.files?.[0]);
    },
    [processFile],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      processFile(event.target.files?.[0]);
      event.target.value = "";
    },
    [processFile],
  );

  return (
    <div
      className={`empty-state${dragActive ? " empty-state--drag-active" : ""}`}
      role="button"
      tabIndex={0}
      aria-label="Drop or choose a markdown file to view"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        className="empty-state__input"
        onChange={handleInputChange}
      />

      <div className="empty-state__main">
        <svg className="empty-state__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <h1 className="empty-state__title">MlookD</h1>
        <p className="empty-state__hint">
          Free online Markdown (.md) viewer — drop or choose a file to preview it instantly.
        </p>
        {error && <p className="empty-state__error">{error}</p>}
      </div>

      <div className="empty-state__footer">
        <p>
          Renders GitHub-flavored Markdown — headings, tables, code blocks, links, and images —
          entirely in your browser. The file is processed on the local machine only; nothing is
          sent to servers or stored in a database.
        </p>
      </div>
    </div>
  );
}
