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
        {/* Not shown visually — read by screen readers and by crawlers that
            don't render CSS/JS, so the page still has a real, keyword-clear
            heading without changing the minimal on-screen design. */}
        <h1 className="visually-hidden">MlookD — free online Markdown (.md) viewer</h1>
        <p className="empty-state__hint">Just drop or choose your .md file</p>
        {error && <p className="empty-state__error">{error}</p>}
      </div>

      <div className="empty-state__footer">
        <p>
          The file is formatted and processed solely on the local machine. Nothing is sent to
          servers or stored in a database.
        </p>
        <p className="visually-hidden">
          Renders GitHub-flavored Markdown — headings, tables, code blocks, links, and images.
        </p>
      </div>
    </div>
  );
}
