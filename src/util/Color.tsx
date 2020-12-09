/**
 * Adapted from:
 * https://github.com/dequelabs/axe-core/blob/82d43a0593a8dc9733b97138f8e6f934ed25dea2/lib/commons/color/color.js#L1
 */

type HSLA = {
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
};

type RGBA = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

/**
 * Convert a CSS color value into a number
 */
function convertColorVal(colorFunc: string, value: string, index: number) {
  if (/%$/.test(value)) {
    // <percentage>
    if (index === 3) {
      // alpha
      return parseFloat(value) / 100;
    }
    return (parseFloat(value) * 255) / 100;
  }
  if (colorFunc[index] === "h") {
    // hue
    if (/turn$/.test(value)) {
      return parseFloat(value) * 360;
    }
    if (/rad$/.test(value)) {
      return parseFloat(value) * 57.3;
    }
  }
  return parseFloat(value);
}

/**
 * Convert HSL to RGB
 */
function hslToRgb({ hue, saturation, lightness, alpha }: HSLA): RGBA {
  // Must be fractions of 1
  saturation /= 255;
  lightness /= 255;

  const high = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const low = high * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = lightness - high / 2;

  let colors;
  if (hue < 60) {
    // red - yellow
    colors = [high, low, 0];
  } else if (hue < 120) {
    // yellow - green
    colors = [low, high, 0];
  } else if (hue < 180) {
    // green - cyan
    colors = [0, high, low];
  } else if (hue < 240) {
    // cyan - blue
    colors = [0, low, high];
  } else if (hue < 300) {
    // blue - purple
    colors = [low, 0, high];
  } else {
    // purple - red
    colors = [high, 0, low];
  }

  const rgb = colors.map((color) => {
    return Math.round((color + base) * 255);
  });

  return { red: rgb[0], green: rgb[1], blue: rgb[2], alpha };
}

function rgbToHsl({ red, green, blue, alpha }: RGBA): HSLA {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;

  const lightness = (max + min) / 2;
  const saturation = chroma > 0 ? chroma / (1 - Math.abs(2 * lightness - 1)) : 0;

  if (chroma === 0) {
    return { hue: 0, saturation, lightness, alpha };
  }

  let hueSegment = 0;
  switch (max) {
    case r:
      hueSegment = ((g - b) / chroma) % 6;
      break;
    case g:
      hueSegment = (b - r) / chroma + 2;
      break;
    case b:
      hueSegment = (g - b) / chroma + 4;
      break;
  }

  return {
    hue: hueSegment * 60,
    saturation,
    lightness,
    alpha,
  };
}

const HEX_REGEX = /^#[0-9a-f]{3,8}$/i;
const COLOR_FUNCTION_REGEX = /^((?:rgb|hsl)a?)\s*\(([^)]*)\)/i;

export default class Color {
  constructor(
    public red: number,
    public green: number,
    public blue: number,
    public alpha: number,
  ) {}

  /**
   * Provide the hex string value for the color
   */
  toHexString(): string {
    var redString = Math.round(this.red).toString(16);
    var greenString = Math.round(this.green).toString(16);
    var blueString = Math.round(this.blue).toString(16);
    return (
      "#" +
      (this.red > 15.5 ? redString : "0" + redString) +
      (this.green > 15.5 ? greenString : "0" + greenString) +
      (this.blue > 15.5 ? blueString : "0" + blueString)
    );
  }

  /**
   * Parse any valid color string and return a new Color object. If the string
   * is not a valid color string, this will return undefined
   */
  static parseString(colorString: string): Color | undefined {
    if (colorString.match(COLOR_FUNCTION_REGEX)) {
      return this.parseColorFnString(colorString);
    }

    if (colorString.match(HEX_REGEX)) {
      return this.parseHexString(colorString);
    }

    return undefined;
  }

  /**
   * Set the color value based on a CSS RGB/RGBA string.
   */
  static parseRgbString(colorString: string): Color | undefined {
    // IE can pass transparent as value instead of rgba
    if (colorString === "transparent") {
      return new Color(0, 0, 0, 0);
    }
    return this.parseColorFnString(colorString);
  }

  /**
   * Set the color value based on a CSS RGB/RGBA string.
   */
  static parseHexString(colorString: string): Color | undefined {
    if (!colorString.match(HEX_REGEX) || [6, 8].includes(colorString.length)) {
      return undefined;
    }
    colorString = colorString.replace("#", "");
    if (colorString.length < 6) {
      const [r, g, b, a] = colorString;
      colorString = r + r + g + g + b + b;
      if (a) {
        colorString += a + a;
      }
    }

    var aRgbHex = colorString.match(/.{1,2}/g);
    if (aRgbHex == null) return undefined;

    return new Color(
      parseInt(aRgbHex[0], 16),
      parseInt(aRgbHex[1], 16),
      parseInt(aRgbHex[2], 16),
      aRgbHex[3] != null ? parseInt(aRgbHex[3], 16) / 255 : 1,
    );
  }

  /**
   * Set the color value based on a CSS rgba/hsla string.
   */
  static parseColorFnString(colorString: string): Color | undefined {
    const [, colorFunc, colorValStr] = colorString.match(COLOR_FUNCTION_REGEX) ?? [];
    if (!colorFunc || !colorValStr) {
      return undefined;
    }

    // Get array of color number strings from the string:
    const colorVals = colorValStr
      .split(/\s*[,/\s]\s*/)
      .map((str) => str.replace(",", "").trim())
      .filter((str) => str !== "");

    // Convert to numbers
    const colorNums = colorVals.map((val, index) => {
      return convertColorVal(colorFunc, val, index);
    });

    if (colorFunc.substr(0, 3) === "hsl") {
      const rgba = hslToRgb({
        hue: colorNums[0],
        saturation: colorNums[1],
        lightness: colorNums[2],
        alpha: colorNums[3],
      });
      return new Color(rgba.red, rgba.green, rgba.blue, rgba.alpha);
    }

    return new Color(
      colorNums[0],
      colorNums[1],
      colorNums[2],
      typeof colorNums[3] === "number" ? colorNums[3] : 1,
    );
  }

  /**
   * Return the equivalent HSLA representation of this Color.
   */
  toHSL(): HSLA {
    return rgbToHsl({ red: this.red, green: this.green, blue: this.blue, alpha: this.alpha });
  }

  /**
   * Get the relative luminance value using the algorithm from
   * http://www.w3.org/WAI/GL/wiki/Relative_luminance.
   */
  getRelativeLuminance(): number {
    var rSRGB = this.red / 255;
    var gSRGB = this.green / 255;
    var bSRGB = this.blue / 255;

    var r = rSRGB <= 0.03928 ? rSRGB / 12.92 : Math.pow((rSRGB + 0.055) / 1.055, 2.4);
    var g = gSRGB <= 0.03928 ? gSRGB / 12.92 : Math.pow((gSRGB + 0.055) / 1.055, 2.4);
    var b = bSRGB <= 0.03928 ? bSRGB / 12.92 : Math.pow((bSRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}
