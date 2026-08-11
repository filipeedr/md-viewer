import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { isMarkdownFile } from "../lib/file";
import type { TocItem } from "../lib/markdown";
import { SCROLL_EDGE_THRESHOLD, getMaxScroll, isAtPageBottom } from "../lib/scroll";
import Toc from "./Toc";
import "../styles/markdown.css";

interface ViewerProps {
  fileName: string;
  html: string;
  headings: TocItem[];
  onFileSelected: (file: File) => void;
}

function getScrollState() {
  return {
    atTop: window.scrollY <= SCROLL_EDGE_THRESHOLD,
    // A page too short to scroll is at both edges at once, so both buttons
    // end up disabled — which is exactly right for a page that can't move.
    atBottom: getMaxScroll() <= 0 || isAtPageBottom(),
  };
}

export default function Viewer({ fileName, html, headings, onFileSelected }: ViewerProps) {
  const [{ atTop, atBottom }, setScrollState] = useState(getScrollState);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // Keep the previous object when neither edge changed: scroll fires many
    // times a second and a fresh object would re-render this whole subtree
    // (the TOC included) on every tick for nothing.
    const handleScroll = () =>
      setScrollState((previous) => {
        const next = getScrollState();
        return next.atTop === previous.atTop && next.atBottom === previous.atBottom
          ? previous
          : next;
      });
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

  // The content element is memoized on the html string so the re-renders
  // driven by scroll/drag state never re-reconcile the document subtree.
  // Without this, react-dom re-applies dangerouslySetInnerHTML on those
  // re-renders, recreating every heading node and silently orphaning the
  // elements the TOC's IntersectionObserver is watching.
  // (html is sanitized with DOMPurify in lib/markdown.ts before reaching here.)
  const content = useMemo(
    () => (
      <div className="viewer__content markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
    ),
    [html],
  );

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
      {/* Fixed-position sidebar — placement in JSX is only semantic. */}
      <Toc items={headings} />

      <div className="viewer__filename">{fileName}</div>
      {content}

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
