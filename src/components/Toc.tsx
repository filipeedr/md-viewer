import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import type { TocItem } from "../lib/markdown";
import { isAtPageBottom } from "../lib/scroll";

interface TocProps {
  items: TocItem[];
}

// A heading counts as "being read" once it crosses the spy line at the top
// quarter of the viewport — the bottom 75% is cut out of the observer's
// root area, so every crossing produces a callback.
const SPY_ROOT_MARGIN = "0px 0px -75% 0px";
const SPY_VIEWPORT_FRACTION = 0.25;
// The cursor is inset inside the active row so it reads as a mark on the
// rail rather than a continuous segment of it.
const THUMB_INSET = 4;

interface ThumbRect {
  top: number;
  height: number;
}

export default function Toc({ items }: TocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thumb, setThumb] = useState<ThumbRect | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Scroll-spy: one IntersectionObserver over the rendered headings. The
  // headings live inside a sibling component's dangerouslySetInnerHTML,
  // mounted in the same commit, so an ordinary effect finds them after paint.
  useEffect(() => {
    if (items.length === 0) return;

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    // The heading being read is simply the last one above the spy line.
    // Measuring that directly — instead of tracking which headings are
    // inside the band and inferring a scroll direction from the entries —
    // is what makes the highlight correct in both directions: it needs no
    // assumption about entry ordering. Geometry is the source of truth,
    // but it only helps when something asks for it — the observer fires on
    // band crossings, and the scroll listener below covers jumps large
    // enough to skip the band without producing a crossing.
    const lastHeadingAboveLine = () => {
      const threshold = window.innerHeight * SPY_VIEWPORT_FRACTION;
      let id: string | null = null;
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= threshold) {
          id = element.id;
        }
      }
      return id;
    };

    // A short final section may never reach the top quarter, so the page
    // bottom pins the last heading active — checked from both the observer
    // callback and a scroll listener, whichever fires last.
    const lastId = elements[elements.length - 1].id;
    const syncActiveId = () => {
      setActiveId(isAtPageBottom() ? lastId : lastHeadingAboveLine());
    };

    // Initialize mid-document correctly: mounting halfway through a document
    // should already highlight the section on screen.
    syncActiveId();

    const observer = new IntersectionObserver(syncActiveId, {
      rootMargin: SPY_ROOT_MARGIN,
    });
    for (const element of elements) {
      observer.observe(element);
    }

    // The observer only notifies on band crossings, so a frame that carries a
    // heading clean across the band — a fling, a scrollbar drag, a held Page
    // Down, find-in-page — changes no intersecting state and fires nothing at
    // all, leaving the highlight behind until some later heading happens to
    // cross. Scroll covers that gap, but measuring every heading on every
    // frame is exactly what AD-6 rejects, so the scan is gated twice: once per
    // animation frame, and only when the frame's delta is big enough to have
    // skipped the band. Ordinary scrolling never reaches the scan.
    let lastY = window.scrollY;
    let frame = 0;
    const handleScroll = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const jumped = Math.abs(y - lastY) > window.innerHeight * SPY_VIEWPORT_FRACTION;
        lastY = y;
        // syncActiveId pins the last heading itself, so the page-bottom case
        // needs no separate branch here — only a reason to recompute.
        if (jumped || isAtPageBottom()) syncActiveId();
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [items]);

  const activeIndex = items.findIndex((item) => item.id === activeId);

  // The sliding cursor is placed from the active row's own box, so it tracks
  // whatever height that row happens to have (wrapping, level font sizes).
  // Measured before paint to avoid a frame at a stale position, and re-measured
  // on resize because row heights shift with the sidebar's layout.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || activeIndex < 0) {
      setThumb(null);
      return;
    }

    const measure = () => {
      const row = list.children[activeIndex];
      if (!(row instanceof HTMLElement)) {
        setThumb(null);
        return;
      }
      setThumb({
        top: row.offsetTop + THUMB_INSET,
        height: Math.max(row.offsetHeight - THUMB_INSET * 2, 0),
      });

      // A long rail scrolls inside itself, so the active row has to be
      // brought into the sidebar's own scrollport or the cursor slides out
      // of sight. Adjusting scrollTop by hand (rather than scrollIntoView)
      // keeps the effect strictly inside the sidebar — scrollIntoView walks
      // the whole ancestor chain and could nudge the window mid smooth-scroll.
      const nav = navRef.current;
      if (nav) {
        const rowBottom = row.offsetTop + row.offsetHeight;
        if (row.offsetTop < nav.scrollTop) {
          nav.scrollTop = row.offsetTop;
        } else if (rowBottom > nav.scrollTop + nav.clientHeight) {
          nav.scrollTop = rowBottom - nav.clientHeight;
        }
      }
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, items]);

  const handleItemClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    // Scroll without pushing the hash into history — the app is URL-less,
    // and the back button should keep leaving the page, not retrace jumps.
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    const heading = document.getElementById(id);
    if (!heading) return;
    heading.scrollIntoView({ behavior: "smooth" });
    // A <button> gives none of the focus handoff an <a href="#id"> would, so
    // move the reading position onto the heading itself — otherwise keyboard
    // and screen-reader users jump visually while their focus stays in the
    // sidebar and the next Tab keeps walking down the TOC.
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    setActiveId(id);
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="toc" aria-label="Table of contents" ref={navRef}>
      {/* The rail is the positioned box both the rows and the cursor measure
          against — the cursor is a sibling of the list so the list keeps only
          <li> children (and its index stays aligned with `items`). */}
      <div className="toc__rail">
        <ul className="toc__list" ref={listRef}>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                data-id={item.id}
                className={`toc__item toc__item--level-${item.level}${
                  item.id === activeId ? " toc__item--active" : ""
                }`}
                aria-current={item.id === activeId ? "location" : undefined}
                onClick={handleItemClick}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>

        {thumb !== null && (
          <span
            className="toc__thumb"
            style={{ top: thumb.top, height: thumb.height }}
            aria-hidden="true"
          />
        )}
      </div>
    </nav>
  );
}
