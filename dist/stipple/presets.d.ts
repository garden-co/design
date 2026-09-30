import type { StipplePattern } from './stipple.js';
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
