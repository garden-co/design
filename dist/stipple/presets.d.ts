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
 * The grid with one fluting angle per gradient centre: four layers, each its
 * own radial gradient behind glass fluted at its own angle (`angles`, in
 * layer order: ink 1, ink 2, ink 1, ink 2). The centres sit apart so each
 * can be dragged on its own.
 */
export declare function gridAnglesPattern(angles?: [number, number, number, number]): StipplePattern;
/**
 * The homepage hero: the grid with its density pulled up and to the right,
 * each of the four layers centred on its own point. Drawn into a box with
 * an aspect ratio of 1.1.
 */
export declare const heroPattern: StipplePattern;
/**
 * Each ink drawn from its own monochrome image instead of a gradient: the
 * image named "a" drives ink 1, "b" ink 2 (dark pixels are dense). Supply
 * the bitmaps in `images` (see `imageDensities`); without them the inks stay
 * empty. Warps still apply, so an image can sit behind fluted glass too.
 */
export declare const imagePattern: StipplePattern;
