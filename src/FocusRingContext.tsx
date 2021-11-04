import * as React from "react";

import { getBestFocusColor, getBackgroundColorFromAncestry } from "./FocusColorUtils";
import {
  Offset,
  FocusRingShowOpts,
  FocusRingAncestry,
  FocusRingStyleProperties,
  FOCUS_RING_COLOR_CSS_PROPERTY,
  FOCUS_RING_RADIUS_CSS_PROPERTY,
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

function parseBorderRadius(radius: string | undefined) {
  if (radius) {
    return parseInt(radius) > 0 ? radius : undefined;
  }
  return undefined;
}

export class FocusRingContextManager {
  targetElement?: Element;
  targetAncestry?: FocusRingAncestry;
  boundingBox?: DOMRect;
  className?: string;
  offset: Offset | number = 0;
  zIndex?: number;
  container: Element | null = null;

  invalidate: () => void = () => null;

  setContainer(element: Element | null) {
    this.container = element;
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
    const topLeft = parseBorderRadius(ancestry.styles[0]?.borderTopLeftRadius);
    const topRight = parseBorderRadius(ancestry.styles[0]?.borderTopRightRadius);
    const bottomRight = parseBorderRadius(ancestry.styles[0]?.borderBottomRightRadius);
    const bottomLeft = parseBorderRadius(ancestry.styles[0]?.borderBottomLeftRadius);

    return `${topLeft ?? 0} ${topRight ?? 0} ${bottomRight ?? 0} ${bottomLeft ?? 0}`;
  }

  private makePositionFromDOMRect(rect: DOMRect) {
    if (this.container == null) return {};

    const containerRect = this.container.getBoundingClientRect();
    const { scrollTop, scrollLeft } = this.container;

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

    return {
      top: scrollTop + rect.top - containerRect.top + top,
      width: rect.width - (right + left),
      height: rect.height - (bottom + top),
      left: scrollLeft + rect.left - containerRect.left + left,
    };
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
        [FOCUS_RING_COLOR_CSS_PROPERTY]: getBestFocusColor(backgroundColor),
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
