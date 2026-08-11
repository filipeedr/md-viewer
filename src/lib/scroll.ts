// Window-scroll geometry shared by the viewer controls and the TOC spy.

// A couple of pixels of slack: sub-pixel layout and elastic scrolling mean
// scrollY rarely lands exactly on the maximum.
export const SCROLL_EDGE_THRESHOLD = 2;

/** How far the window can still scroll down; 0 on pages shorter than the viewport. */
export function getMaxScroll(): number {
  return document.documentElement.scrollHeight - window.innerHeight;
}

/**
 * True when the window sits at the bottom of a page that actually scrolls.
 * A page shorter than the viewport is deliberately *not* "at the bottom"
 * here — there is no bottom to reach, so pinning the last heading would be
 * wrong. Callers that do want to treat it as such (the scroll-to-bottom
 * button, which must be disabled) check `getMaxScroll() <= 0` themselves.
 */
export function isAtPageBottom(): boolean {
  const maxScroll = getMaxScroll();
  return maxScroll > 0 && window.scrollY >= maxScroll - SCROLL_EDGE_THRESHOLD;
}
