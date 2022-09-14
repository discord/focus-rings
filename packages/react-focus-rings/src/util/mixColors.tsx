import Color from "./Color";

export default function mixColors(color1: Color, color2: Color): Color {
  const alpha = color1.alpha;
  const r = (1 - alpha) * color2.red + alpha * color1.red;
  const g = (1 - alpha) * color2.green + alpha * color1.green;
  const b = (1 - alpha) * color2.blue + alpha * color1.blue;
  const a = color1.alpha + color2.alpha * (1 - color1.alpha);

  return new Color(r, g, b, a);
}
