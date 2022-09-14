import shallowEqual from "shallowequal";

import { ACTIVE_RING_CONTEXT_MANAGER } from "./FocusRingContext";

let tracking = false;
let rafId: number | undefined;

let mostRecentStyle = {};

function invalidateCurrentRing() {
  if (!tracking) return;

  const newStyle = ACTIVE_RING_CONTEXT_MANAGER?.getStyle();
  if (newStyle != null && !shallowEqual(newStyle, mostRecentStyle)) {
    mostRecentStyle = newStyle;
    ACTIVE_RING_CONTEXT_MANAGER?.invalidate();
  } else {
    rafId != null && cancelAnimationFrame(rafId);
  }
  rafId = requestAnimationFrame(invalidateCurrentRing);
}

/**
 * This manager sets up an animation frame loop to force-update focus rings,
 * ensuring that they should always match the current position of the active
 * element on the page.
 *
 * This is naive in that it only toggles the loop based on whether keyboard
 * mode is active. A true long-term solution for this would be a way to detect
 * when the page layout has changed (or rather, just _subscribe_ to animation
 * frames, rather than _request_ them) and only force updates in those cases.
 */
export default {
  enableAnimationTracking() {
    tracking = true;
    rafId = requestAnimationFrame(invalidateCurrentRing);
  },

  disableAnimationTracking() {
    tracking = false;
    rafId != null && cancelAnimationFrame(rafId);
  },
};
