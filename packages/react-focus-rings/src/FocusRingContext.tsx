import * as React from "react";

import { getBestFocusColor, getBackgroundColorFromAncestry } from "./FocusColorUtils";
import {
  Offset,
  FocusRingShowOpts,
  FocusRingAncestry,
  FocusRingStyleProperties,
  FOCUS_RING_COLOR_CSS_PROPERTY,
  FOCUS_RING_RADIUS_CSS_PROPERTY,
  ThemeOptions,
} from "./FocusRingTypes";

// This is a global singleton value because there should only ever be one focus
// ring visible on a page. This is also not a stack of values for the same
// reason: only one ring should be visible, and an actual focus manager would
// be responsible for restoring focus based on a stack, then this value would
// be replaced with the new active manager.
export let ACTIVE_RING_CONTEXT_MANAGER: FocusRingContextManager | undefined;

function setActiveRingContextManager(manager: FocusRingContextManager) {
  if (manager !== ACTIVE_RING_CONTEXT_MANAGER) {
    ACTIVE_RING_CONTEXT_MANAGER?.hide();
    ACTIVE_RING_CONTEXT_MANAGER = manager;
  }
}

// Keep this in sync with the box-shadow spread in styles.css.
const RING_WIDTH = 4;

const AXES = {
  x: {
    start: "left",
    clientStart: "clientLeft",
    clientSize: "clientWidth",
    scroll: "scrollLeft",
    scrollSize: "scrollWidth",
  },
  y: {
    start: "top",
    clientStart: "clientTop",
    clientSize: "clientHeight",
    scroll: "scrollTop",
    scrollSize: "scrollHeight",
  },
} as const;

type Axis = keyof typeof AXES;

type Extent = { start: number; end: number };

type FlowDirection = "forward" | "backward";

function parseBorderRadius(radius: string | undefined) {
  if (radius) {
    return parseInt(radius) > 0 ? radius : undefined;
  }
  return undefined;
}

function reverse(direction: FlowDirection, reversed: boolean): FlowDirection {
  if (!reversed) return direction;
  return direction === "forward" ? "backward" : "forward";
}

/**
 * Return the physical direction that content flows along each axis, where
 * forward is right or down.
 */
function getFlowDirections(style: CSSStyleDeclaration): Record<Axis, FlowDirection> {
  const { writingMode, direction, display, flexDirection, flexWrap } = style;
  let inline = reverse(direction === "rtl" ? "backward" : "forward", writingMode === "sideways-lr");
  let block: FlowDirection =
    writingMode === "vertical-rl" || writingMode === "sideways-rl" ? "backward" : "forward";

  if (display.endsWith("flex")) {
    const mainReversed = flexDirection.endsWith("reverse");
    const crossReversed = flexWrap === "wrap-reverse";
    const column = flexDirection.startsWith("column");
    inline = reverse(inline, column ? crossReversed : mainReversed);
    block = reverse(block, column ? mainReversed : crossReversed);
  }

  return writingMode === "horizontal-tb" ? { x: inline, y: block } : { x: block, y: inline };
}

/**
 * Return the viewport positions where `element` starts and stops showing
 * content along `axis`. For a scroll container, this covers everything it can
 * scroll to.
 */
function getClipExtent(
  element: Element,
  rect: DOMRect,
  overflow: string,
  flowDirection: FlowDirection,
  axis: Axis,
): Extent {
  const { start, clientStart, clientSize, scroll, scrollSize } = AXES[axis];
  const paddingStart = rect[start] + element[clientStart];
  // `clip` never scrolls, so nothing outside the padding box is ever visible.
  if (overflow === "clip") {
    return { start: paddingStart, end: paddingStart + element[clientSize] };
  }

  // Take the overflow direction from the layout, not the offset's sign, which
  // elastic overscroll can push past zero.
  const backward = flowDirection === "backward";
  const overflowSize = element[scrollSize] - element[clientSize];
  const scrollStart = paddingStart - element[scroll] - (backward ? overflowSize : 0);
  return { start: scrollStart, end: scrollStart + element[scrollSize] };
}

/**
 * Shrink the ring along one axis so that its shadow stays inside `extent`.
 */
function insetToExtent(
  /** In ring coordinates. */
  start: number,
  size: number,
  /** In viewport coordinates. */
  extent: Extent | undefined,
  /** The viewport position of ring coordinate 0. */
  origin: number,
): [number, number] {
  if (extent == null) return [start, size];

  const insetStart = Math.max(start, extent.start - origin + RING_WIDTH);
  const insetEnd = Math.min(start + size, extent.end - origin - RING_WIDTH);
  return [insetStart, Math.max(0, insetEnd - insetStart)];
}

export class FocusRingContextManager {
  targetElement?: Element;
  targetAncestry?: FocusRingAncestry;
  boundingBox?: DOMRect;
  className?: string;
  offset: Offset | number = 0;
  zIndex?: number;
  container: Element | null = null;
  themeOptions?: ThemeOptions;
  containRing = false;

  invalidate: () => void = () => null;

  setContainer(element: Element | null) {
    this.container = element;
  }

  setThemeOptions(themeOptions?: ThemeOptions) {
    this.themeOptions = themeOptions;
  }

  setContainRing(containRing: boolean) {
    if (containRing === this.containRing) return;
    this.containRing = containRing;
    this.invalidate();
  }

  showElement(element: Element, opts: FocusRingShowOpts = {}) {
    this.targetElement = element;
    this.targetAncestry = this.getElementAncestors(this.targetElement);
    this.boundingBox = undefined;
    this.className = opts.className;
    this.offset = opts.offset ?? 0;
    this.zIndex = opts.zIndex;
    setActiveRingContextManager(this);
    this.invalidate();
  }

  hide() {
    this.targetElement = undefined;
    this.targetAncestry = undefined;
    this.boundingBox = undefined;
    this.className = undefined;
    this.offset = 0;
    this.zIndex = undefined;
    this.invalidate();
  }

  get visible() {
    return this.targetElement != null || this.boundingBox != null;
  }

  /**
   * Return the full ancestry of the given element, including both the
   * element ancestors alongside the live computed styles object for
   * each element.
   */
  private getElementAncestors(element?: Element): FocusRingAncestry {
    if (element == null) return { elements: [], styles: [] };

    const elements: Element[] = [];
    const styles: CSSStyleDeclaration[] = [];

    let current: Element | null = element;
    while (current != null) {
      elements.push(current);
      typeof window !== "undefined" && styles.push(window.getComputedStyle(current));
      current = current.parentElement;
    }
    return { elements, styles };
  }

  /**
   * To accomodate elements that use z-index to stylistically overlap elements
   * within a single container, this function will calculate the lowest z-index
   * needed to ensure that the focus ring appears at the top of that stacking
   * context. For elements with no stacking context between them and this focus
   * scope's container, no z-index will be applied to the ring.
   */
  private getNextZIndexForAncestry(ancestry: FocusRingAncestry) {
    for (let i = 0; i < ancestry.elements.length; i++) {
      const element = ancestry.elements[i];
      const style = ancestry.styles[i];
      const zIndex = parseInt(style.getPropertyValue("z-index"));
      if (!isNaN(zIndex)) return zIndex + 1;

      if (element === this.container) break;
    }

    return undefined;
  }

  private getBorderRadius(ancestry: FocusRingAncestry) {
    const topLeft = parseBorderRadius(ancestry.styles[0]?.borderTopLeftRadius) ?? "0";
    const topRight = parseBorderRadius(ancestry.styles[0]?.borderTopRightRadius) ?? "0";
    const bottomRight = parseBorderRadius(ancestry.styles[0]?.borderBottomRightRadius) ?? "0";
    const bottomLeft = parseBorderRadius(ancestry.styles[0]?.borderBottomLeftRadius) ?? "0";

    if (topLeft === "0" && topRight === "0" && bottomRight === "0" && bottomLeft === "0") {
      return undefined;
    }

    return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
  }

  private makePositionFromDOMRect(rect: DOMRect) {
    if (this.container == null) return {};

    const containerRect = this.container.getBoundingClientRect();
    const { scrollTop, scrollLeft, clientTop, clientLeft } = this.container;

    let top = 0;
    let right = 0;
    let bottom = 0;
    let left = 0;

    if (typeof this.offset === "number") {
      top = this.offset;
      right = this.offset;
      bottom = this.offset;
      left = this.offset;
    } else {
      top = this.offset.top ?? 0;
      right = this.offset.right ?? 0;
      bottom = this.offset.bottom ?? 0;
      left = this.offset.left ?? 0;
    }

    const position = {
      // `left`/`top` on an absolutely positioned ring resolve against the
      // container's padding-box, not its border-box, so the origin must move
      // in by `clientTop`/`clientLeft` (border width, plus any leading-edge
      // scrollbar gutter) or the ring drifts by that amount.
      top: scrollTop + rect.top - (containerRect.top + clientTop) + top,
      width: rect.width - (right + left),
      height: rect.height - (bottom + top),
      left: scrollLeft + rect.left - (containerRect.left + clientLeft) + left,
    };

    return this.containRing
      ? this.containToScrollExtent(this.container, containerRect, position)
      : position;
  }

  // Keep the ring inside the whole scrollable area, not only the visible part.
  // Otherwise, the ring would be pulled into view on an element that is only
  // partly visible.
  private containToScrollExtent(
    container: Element,
    containerRect: DOMRect,
    position: { top: number; left: number; width: number; height: number },
  ) {
    // Styles and ancestry can change at any time, so look this up on every call.
    // Each axis stops at the nearest element that clips it.
    let x: Extent | undefined;
    let y: Extent | undefined;
    let current: Element | null = container;
    while (current != null && current !== document.body && (x == null || y == null)) {
      const style = window.getComputedStyle(current);
      const { overflowX, overflowY } = style;
      const clipsX = x == null && overflowX !== "visible";
      const clipsY = y == null && overflowY !== "visible";
      if (clipsX || clipsY) {
        const rect = current === container ? containerRect : current.getBoundingClientRect();
        const flow = getFlowDirections(style);
        if (clipsX) x = getClipExtent(current, rect, overflowX, flow.x, "x");
        if (clipsY) y = getClipExtent(current, rect, overflowY, flow.y, "y");
      }
      current = current.parentElement;
    }

    const [left, width] = insetToExtent(
      position.left,
      position.width,
      x,
      containerRect.left + container.clientLeft - container.scrollLeft,
    );
    const [top, height] = insetToExtent(
      position.top,
      position.height,
      y,
      containerRect.top + container.clientTop - container.scrollTop,
    );
    return { top, left, width, height };
  }

  /**
   * Return the necessary computed styles for displaying a focus ring as
   * defined by the current state of this ring context.
   */
  getStyle(): FocusRingStyleProperties {
    let styles = {};
    if (this.boundingBox != null) {
      styles = {
        ...this.makePositionFromDOMRect(this.boundingBox),
        zIndex: this.zIndex,
      };
    }

    if (this.targetElement != null && this.targetAncestry != null) {
      const backgroundColor = getBackgroundColorFromAncestry(this.targetAncestry);
      styles = {
        ...this.makePositionFromDOMRect(this.targetElement.getBoundingClientRect()),
        zIndex: this.zIndex ?? this.getNextZIndexForAncestry(this.targetAncestry),
        [FOCUS_RING_COLOR_CSS_PROPERTY]: getBestFocusColor(backgroundColor, this.themeOptions),
        [FOCUS_RING_RADIUS_CSS_PROPERTY]: this.getBorderRadius(this.targetAncestry),
      };
    }

    return styles;
  }
}

const GLOBAL_FOCUS_RING_CONTEXT = new FocusRingContextManager();
typeof window !== "undefined" && GLOBAL_FOCUS_RING_CONTEXT.setContainer(document.body);

const FocusRingContext = React.createContext(GLOBAL_FOCUS_RING_CONTEXT);

export default FocusRingContext;
