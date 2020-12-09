export type Offset = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

export type FocusRingShowOpts = {
  className?: string;
  offset?: Offset | number;
  zIndex?: number;
};

export type FocusRingAncestry = {
  elements: Element[];
  styles: CSSStyleDeclaration[];
};

export interface FocusRingProps {
  within?: boolean;
  enabled?: boolean;
  focused?: boolean;
  offset?: Offset | number;
  focusTarget?: React.RefObject<Element>;
  ringTarget?: React.RefObject<Element>;
  ringClassName?: string;
  focusClassName?: string;
  focusWithinClassName?: string;
}

export const FOCUS_RING_COLOR_CSS_PROPERTY = "--__adaptive-focus-ring-color";
export const FOCUS_RING_RADIUS_CSS_PROPERTY = "--__adaptive-focus-ring-radius";

export type FocusRingStyleProperties = {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  [FOCUS_RING_COLOR_CSS_PROPERTY]?: string;
  [FOCUS_RING_RADIUS_CSS_PROPERTY]?: string;
};
