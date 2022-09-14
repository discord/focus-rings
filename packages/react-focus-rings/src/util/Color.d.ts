/**
 * Adapted from:
 * https://github.com/dequelabs/axe-core/blob/82d43a0593a8dc9733b97138f8e6f934ed25dea2/lib/commons/color/color.js#L1
 */
declare type HSLA = {
    hue: number;
    saturation: number;
    lightness: number;
    alpha: number;
};
export default class Color {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    constructor(red: number, green: number, blue: number, alpha: number);
    /**
     * Provide the hex string value for the color
     */
    toHexString(): string;
    /**
     * Parse any valid color string and return a new Color object. If the string
     * is not a valid color string, this will return undefined
     */
    static parseString(colorString: string): Color | undefined;
    /**
     * Set the color value based on a CSS RGB/RGBA string.
     */
    static parseRgbString(colorString: string): Color | undefined;
    /**
     * Set the color value based on a CSS RGB/RGBA string.
     */
    static parseHexString(colorString: string): Color | undefined;
    /**
     * Set the color value based on a CSS rgba/hsla string.
     */
    static parseColorFnString(colorString: string): Color | undefined;
    /**
     * Return the equivalent HSLA representation of this Color.
     */
    toHSL(): HSLA;
    /**
     * Get the relative luminance value using the algorithm from
     * http://www.w3.org/WAI/GL/wiki/Relative_luminance.
     */
    getRelativeLuminance(): number;
}
export {};
//# sourceMappingURL=Color.d.ts.map