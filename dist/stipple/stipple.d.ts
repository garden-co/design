export type Ink = 'a' | 'b';
export type Source = 
/** 1 at the centre falling to 0 at `radius`, shaped by `gamma`. */
{
    type: 'radial';
    x?: number;
    y?: number;
    radius: number;
    gamma?: number;
}
/** 0 at `from` rising to 1 at `to`, along `angle` (0° right, 90° down). */
 | {
    type: 'linear';
    angle: number;
    from: number;
    to: number;
    gamma?: number;
};
/**
 * Fluted glass with ribs perpendicular to `angle`, `period` apart.
 *
 * "orthographic" (the default) looks straight through each rib: the plane is
 * unchanged, but every rib is lit hard at its leading edge and fades towards
 * its trailing edge (`falloff` shapes the fade, `mirror` swaps the edges), the
 * same way everywhere on the page.
 *
 * "perspective" shows the plane behind each rib scaled by `scale` around the
 * rib's centre (negative flips it), shifted by `shift` periods; `bend` curves
 * the scale towards the rib edges like a real lens. Which edge ends up sharp
 * then depends on which way the gradient runs behind the rib.
 */
export type Flute = {
    type: 'flute';
    angle: number;
    period: number;
    projection?: 'orthographic' | 'perspective';
    falloff?: number;
    mirror?: boolean;
    scale?: number;
    shift?: number;
    bend?: number;
    phase?: number;
};
export type Warp = Flute
/** Mirrors across the line through the origin at `angle`. */
 | {
    type: 'mirror';
    angle: number;
} | {
    type: 'rotate';
    angle: number;
} | {
    type: 'translate';
    x: number;
    y: number;
};
export type Layer = {
    ink: Ink;
    source: Source;
    /** Applied in order, from the page towards the source. */
    warps?: Warp[];
    /** Multiplies this layer's density. */
    gain?: number;
};
export type StipplePattern = {
    layers: Layer[];
    inks: {
        a: string;
        b: string;
    };
    /** Distance between sample cells, in pattern units. */
    spacing: number;
    /** Dot radius, in pattern units. */
    radius: number;
    /** For grid points: 0 = a regular grid, 1 = anywhere in their cell. */
    jitter?: number;
    /** Scales both densities before sampling. */
    gain?: number;
    /**
     * Extra copies of all layers, turned by these angles and combined with the
     * originals before sampling (a grid is stripes plus a copy at 90°).
     */
    copies?: number[];
    /** How layers of the same ink combine; defaults to "screen". */
    blend?: Blend;
    /** "independent" samples each ink on its own points; "shared" allows one dot per point. */
    sampling?: 'independent' | 'shared';
    /**
     * Where dots can go: "grid" is one candidate per cell, moved by `jitter`;
     * "blue-noise" is an evenly spread random point set with no grid to it.
     */
    points?: 'grid' | 'blue-noise';
    seed?: number;
};
export type Densities = {
    a: number;
    b: number;
};
/** Compiles one layer into a density function of a page point. */
export declare function compileLayer(layer: Layer): (x: number, y: number) => number;
/** Density of one layer at a page point. */
export declare function layerAt(layer: Layer, x: number, y: number): number;
export type Blend = 'screen' | 'max' | 'multiply';
/**
 * Ink densities (0–1 each) at a page point in pattern units, centre at the
 * origin. Layers of the same ink combine by `blend`: "screen" overlays them
 * like light, "max" keeps the brighter, "multiply" keeps only where all are lit.
 */
export declare function densitiesAt(layers: Layer[], x: number, y: number, blend?: Blend): Densities;
export type Dot = {
    x: number;
    y: number;
    ink: Ink;
};
/**
 * Samples the pattern over a rectangle (pattern units, centre at the origin)
 * and calls `emit` per dot. Candidate points depend only on the seed, never
 * on the rectangle, so the same seed gives the same dots wherever it falls.
 */
export declare function stipple(pattern: StipplePattern, bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
}, emit: (dot: Dot) => void): void;
/**
 * A tileable set of TILE² points in [0, TILE)², ordered so every prefix is
 * evenly spread (Mitchell's best candidate on a torus): point k is the
 * candidate farthest from points 0..k-1. Stored as x, y pairs in rank order.
 */
export declare function blueNoiseTile(seed: number): Float64Array;
/** The same layers turned by `angle`. */
export declare function rotated(layers: Layer[], angle: number): Layer[];
/** The pattern's layers plus its rotated copies. */
export declare function expandCopies(pattern: Pick<StipplePattern, 'layers' | 'copies'>): Layer[];
