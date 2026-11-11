import type { StipplePattern } from './stipple.js';
/**
 * The two brand inks, mint and the logo blue, per colour scheme (palette.css:
 * --color-jazz-ink-mint, --color-jazz-ink-blue). A canvas paints literal
 * colours, so pick the set for the page's resolved theme:
 *
 *   <StippleCanvas pattern={{...heroPattern, inks: jazzInks[theme]}} />
 *
 * The presets carry the light set.
 */
export declare const jazzInks: {
    readonly light: {
        readonly a: "#00c17b";
        readonly b: "#146aff";
    };
    readonly dark: {
        readonly a: "#62f5c0";
        readonly b: "#146aff";
    };
};
/** Diagonal stripes. */
export declare const stripePattern: StipplePattern;
/**
 * Stripes across and down, each with its own fluting width, combined per ink
 * before sampling. "screen" keeps both sets of lines visible where they
 * cross; "multiply" would keep only the crossings (a checkerboard).
 */
export declare const gridPattern: StipplePattern;
/**
 * The homepage hero: the grid with its density pulled up and to the right,
 * each of the four layers centred on its own point. Drawn into a box with
 * an aspect ratio of 1.1.
 */
export declare const heroPattern: StipplePattern;
