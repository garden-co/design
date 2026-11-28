import { type CSSProperties } from 'react';
import { type StipplePattern } from './stipple.js';
/**
 * Draws a stipple pattern into a canvas that fills its box. The pattern's
 * centre sits at the box centre and one pattern unit is half the box height,
 * so the composition scales with the box. Dots are worked out in a worker and
 * kept while only the box's size changes; the canvas gets `data-drawn` once it
 * shows the pattern.
 *
 * Three optional CSS custom properties (read from the canvas, so they can be
 * set on any ancestor) pin details to screen pixels instead, so a bigger box
 * shows more of them rather than bigger ones: `--pattern-dot-radius` and
 * `--pattern-dot-spacing` (px) replace the pattern's `radius` and `spacing`,
 * and `--pattern-rib-unit` (px) is the size of one pattern unit for fluting
 * widths, so each rib is `period × rib unit` pixels wide.
 */
export declare function StippleCanvas({ pattern, className, style, }: {
    pattern: StipplePattern;
    className?: string;
    style?: CSSProperties;
}): import("react").JSX.Element;
/** Renders `pattern` over the whole canvas at its current pixel size, in place. */
export declare function drawStipple(canvas: HTMLCanvasElement, pattern: StipplePattern): void;
/**
 * Renders each ink of `pattern` into a canvas of its own, `width × height`
 * pixels with a transparent background: one plate per ink, as for screen
 * printing. Dots are worked out once for all inks, so the plates line up
 * exactly with each other and with `drawStipple`.
 */
export declare function drawStipplePlates(pattern: StipplePattern, width: number, height: number): Record<string, HTMLCanvasElement>;
