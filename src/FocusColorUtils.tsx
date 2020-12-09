import Color from "./util/Color";
import mixColors from "./util/mixColors";

import type { FocusRingAncestry } from "./FocusRingTypes";

enum ALLOWED_FOCUS_RING_COLORS {
  PRIMARY = "var(--focus-primary)",
  WHITE = "rgba(255,255,255,0.7)",
  BLACK = "rgba(0, 0, 0, 0.85)",
}

export function getBestFocusColor(color?: Color) {
  if (color == null) return ALLOWED_FOCUS_RING_COLORS.PRIMARY;

  const { saturation } = color.toHSL();
  const brightness = color.getRelativeLuminance();
  if (saturation <= 0.4) {
    return ALLOWED_FOCUS_RING_COLORS.PRIMARY;
  }

  return brightness < 200 ? ALLOWED_FOCUS_RING_COLORS.WHITE : ALLOWED_FOCUS_RING_COLORS.BLACK;
}

export function getBackgroundColorFromAncestry(ancestry: FocusRingAncestry): Color {
  const colors: Color[] = [];
  const parentStyles = ancestry.styles.slice(1);
  for (const ancestor of parentStyles) {
    const layerColor = Color.parseString(ancestor.backgroundColor);
    if (layerColor == null) continue;
    if (layerColor.alpha > 0.95) return layerColor;

    colors.push(layerColor);
  }

  colors.push(new Color(255, 255, 255, 1));
  return colors.reduce(mixColors);
}
