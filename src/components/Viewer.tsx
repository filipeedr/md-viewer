import { useCallback, useEffect, useState, type DragEvent } from "react";
import { isMarkdownFile } from "../lib/file";
import "../styles/markdown.css";

interface ViewerProps {
  fileName: string;
  html: string;
  onFileSelected: (file: File) => void;
}

const SCROLL_EDGE_THRESHOLD = 2;

function getScrollState() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return {
    atTop: scrollTop <= SCROLL_EDGE_THRESHOLD,
    atBottom: maxScroll <= 0 || scrollTop >= maxScroll - SCROLL_EDGE_THRESHOLD,
  };
}

export default function Viewer({ fileName, html, onFileSelected }: ViewerProps) {
  const [{ atTop, atBottom }, setScrollState] = useState(getScrollState);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollState(getScrollState());
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Jump back to the top whenever the displayed document changes, so a
  // dropped replacement file starts being read from the beginning.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [fileName]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
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
      const file = event.dataTransfer.files?.[0];
      if (file && isMarkdownFile(file)) {
        onFileSelected(file);
      }
    },
    [onFileSelected],
  );

  return (
    <div
      className={`viewer${dragActive ? " viewer--drag-active" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="viewer__filename">{fileName}</div>
      {/* html is sanitized with DOMPurify in lib/markdown.ts before reaching here */}
      <div className="viewer__content markdown-body" dangerouslySetInnerHTML={{ __html: html }} />

      <div className="viewer__scroll-controls">
        <button
          type="button"
          className="viewer__scroll-button"
          aria-label="Scroll to top"
          onClick={scrollToTop}
          disabled={atTop}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 15l6-6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="viewer__scroll-button"
          aria-label="Scroll to bottom"
          onClick={scrollToBottom}
          disabled={atBottom}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
