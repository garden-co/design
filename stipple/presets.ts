import type {Flute, Layer, StipplePattern} from './stipple.ts';

// Pattern units: 1 = half the pattern's height.

/**
 * The two brand inks, mint and the logo blue, per colour scheme (palette.css:
 * --color-jazz-ink-mint, --color-jazz-ink-blue). A canvas paints literal
 * colours, so pick the set for the page's resolved theme:
 *
 *   <StippleCanvas pattern={{...heroPattern, inks: jazzInks[theme]}} />
 *
 * The presets carry the light set.
 */
export const jazzInks = {
  light: {a: '#00c17b', b: '#146aff'},
  dark: {a: '#62f5c0', b: '#146aff'},
} as const satisfies Record<'light' | 'dark', StipplePattern['inks']>;

const inks = jazzInks.light;

/**
 * Each ink is a radial gradient centred near the middle (the two slightly
 * apart) behind the same fluted glass, seen straight on: green's ribs are lit
 * hard at their leading edge and fade across, indigo's are mirrored (lit hard
 * at the trailing edge), so the two inks' sharp edges meet on the shared rib
 * lines everywhere.
 */
function stripes(flute: Flute, radius: number, offset: number): Layer[] {
  return [
    {
      ink: 'a',
      source: {type: 'radial', x: -offset, y: -offset, radius, gamma: 1.4},
      warps: [flute],
    },
    {
      ink: 'b',
      source: {type: 'radial', x: offset, y: offset, radius, gamma: 1.4},
      warps: [{...flute, mirror: !flute.mirror}],
    },
  ];
}

/** Diagonal stripes. */
export const stripePattern: StipplePattern = {
  inks,
  spacing: 0.006,
  radius: 0.0025,
  gain: 1.4,
  seed: 3,
  points: 'blue-noise',
  layers: stripes({type: 'flute', angle: 60, period: 0.16, falloff: 2.5}, 1.4, 0.12),
};

/**
 * Stripes across and down, each with its own fluting width, combined per ink
 * before sampling. "screen" keeps both sets of lines visible where they
 * cross; "multiply" would keep only the crossings (a checkerboard).
 */
export const gridPattern: StipplePattern = {
  inks,
  spacing: 0.006,
  radius: 0.0025,
  gain: 1.2,
  seed: 7,
  points: 'blue-noise',
  blend: 'screen',
  layers: [
    ...stripes({type: 'flute', angle: 0, period: 0.12, falloff: 4}, 1.4, 0.12),
    ...stripes({type: 'flute', angle: 90, period: 0.12, falloff: 4}, 1.4, 0.12),
  ],
};

/**
 * The grid with one fluting angle per gradient centre: four layers, each its
 * own radial gradient behind glass fluted at its own angle (`angles`, in
 * layer order: ink 1, ink 2, ink 1, ink 2). The centres sit apart so each
 * can be dragged on its own.
 */
export function gridAnglesPattern(angles: [number, number, number, number] = [0, 45, 90, 135]): StipplePattern {
  const centres = [
    [-0.3, -0.3],
    [0.3, -0.3],
    [-0.3, 0.3],
    [0.3, 0.3],
  ] as const;
  return {
    ...gridPattern,
    layers: angles.map((angle, index) => {
      const ink = index % 2 === 0 ? 'a' : 'b';
      const [x, y] = centres[index];
      return {
        ink,
        source: {type: 'radial', x, y, radius: 1.4, gamma: 1.4},
        warps: [{type: 'flute', angle, period: 0.12, falloff: 4, mirror: ink === 'b'}],
      } satisfies Layer;
    }),
  };
}

const heroFlute = (angle: number, period: number, mirror: boolean): Flute => ({
  type: 'flute',
  angle,
  period,
  falloff: 4,
  mirror,
});

const heroRadial = (x: number, y: number) => ({type: 'radial', x, y, radius: 2.15, gamma: 4.05}) as const;

/**
 * The homepage hero: the grid with its density pulled up and to the right,
 * each of the four layers centred on its own point. Drawn into a box with
 * an aspect ratio of 1.1.
 */
export const heroPattern: StipplePattern = {
  inks,
  spacing: 0.0045,
  radius: 0.0025,
  gain: 1.25,
  seed: 7,
  points: 'blue-noise',
  blend: 'screen',
  layers: [
    {ink: 'a', source: heroRadial(0.331, -0.57), warps: [heroFlute(0, 0.2, false)]},
    {ink: 'b', source: heroRadial(0.751, -0.55), warps: [heroFlute(0, 0.2, true)]},
    {ink: 'a', source: heroRadial(0.637, -0.799), warps: [heroFlute(90, 0.12, false)]},
    {ink: 'b', source: heroRadial(0.66, -0.197), warps: [heroFlute(90, 0.12, true)]},
  ],
};

/**
 * Each ink drawn from its own monochrome image instead of a gradient: the
 * image named "a" drives ink 1, "b" ink 2 (dark pixels are dense). Supply
 * the bitmaps in `images` (see `imageDensities`); without them the inks stay
 * empty. Warps still apply, so an image can sit behind fluted glass too.
 */
export const imagePattern: StipplePattern = {
  inks,
  spacing: 0.0045,
  radius: 0.0025,
  gain: 1,
  seed: 7,
  points: 'blue-noise',
  layers: [
    {ink: 'a', source: {type: 'image', image: 'a', x: 0, y: 0, height: 2}},
    {ink: 'b', source: {type: 'image', image: 'b', x: 0, y: 0, height: 2}},
  ],
};
