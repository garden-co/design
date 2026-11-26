import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  blueNoiseTile,
  densitiesAt,
  expandCopies,
  imageDensities,
  layerAt,
  rotated,
  stipple,
  type Dot,
  type Layer,
  type StipplePattern,
} from './stipple.ts';
import {gridAnglesPattern, gridPattern, imagePattern, stripePattern} from './presets.ts';

/** The few matchers these tests use, on node:assert. */
const expect = (actual: unknown) => ({
  toBe: (expected: unknown) => assert.equal(actual, expected),
  toEqual: (expected: unknown) => assert.deepEqual(actual, expected),
  toBeCloseTo: (expected: number) =>
    assert.ok(Math.abs((actual as number) - expected) < 0.005, `${actual} ≉ ${expected}`),
  toBeGreaterThan: (n: number) => assert.ok((actual as number) > n, `${actual} > ${n}`),
  toBeGreaterThanOrEqual: (n: number) => assert.ok((actual as number) >= n, `${actual} >= ${n}`),
  toBeLessThan: (n: number) => assert.ok((actual as number) < n, `${actual} < ${n}`),
  toBeLessThanOrEqual: (n: number) => assert.ok((actual as number) <= n, `${actual} <= ${n}`),
  toHaveLength: (n: number) => assert.equal((actual as unknown[]).length, n),
  not: {toEqual: (expected: unknown) => assert.notDeepEqual(actual, expected)},
});

const collect = (pattern: StipplePattern, left: number, top: number, right: number, bottom: number) => {
  const dots: Dot[] = [];
  stipple(pattern, {left, top, right, bottom}, (dot) => dots.push(dot));
  return dots;
};

const key = (dot: Dot) => `${dot.x.toFixed(9)},${dot.y.toFixed(9)},${dot.ink}`;

// Rises from 0 at x = 0 to 1 at x = 1.
const ramp: Layer = {ink: 'a', source: {type: 'linear', angle: 0, from: 0, to: 1}};

describe('layerAt', () => {
  it('reads radial and linear gradients', () => {
    expect(layerAt(ramp, 0.25, 7)).toBeCloseTo(0.25);
    const radial: Layer = {ink: 'b', source: {type: 'radial', x: 1, y: 0, radius: 2}};
    expect(layerAt(radial, 1, 0)).toBe(1);
    expect(layerAt(radial, 1, 1)).toBeCloseTo(0.5);
    expect(layerAt(radial, 5, 0)).toBe(0);
  });

  it('fluted glass repeats a stretched slice per rib, with sharp edges between ribs', () => {
    const fluted: Layer = {
      ...ramp,
      source: {type: 'linear', angle: 0, from: -1, to: 1},
      warps: [{type: 'flute', angle: 0, period: 0.2, projection: 'perspective', scale: 8}],
    };
    // Inside a rib the ramp runs from dark to bright ...
    expect(layerAt(fluted, 0.01, 0)).toBeLessThan(layerAt(fluted, 0.19, 0));
    // ... and neighbouring ribs show nearly the same slice (drifting by one
    // period of the source per rib), so it drops sharply at each edge.
    expect(layerAt(fluted, 0.199, 0) - layerAt(fluted, 0.201, 0)).toBeGreaterThan(0.6);
    expect(Math.abs(layerAt(fluted, 0.05, 0) - layerAt(fluted, 0.25, 0))).toBeLessThan(0.15);
  });

  it('a negative flute scale mirrors each rib, keeping its edges in place', () => {
    const flute = {
      type: 'flute',
      angle: 0,
      period: 0.2,
      projection: 'perspective',
      scale: 8,
    } as const;
    const source = {type: 'linear', angle: 0, from: -1, to: 1} as const;
    const up = layerAt({ink: 'a', source, warps: [flute]}, 0.05, 0);
    const down = layerAt({ink: 'a', source, warps: [{...flute, scale: -8}]}, 0.15, 0);
    expect(down).toBeCloseTo(up);
  });

  it('rotates and mirrors the plane', () => {
    const [turned] = rotated([ramp], 90);
    expect(layerAt(turned, 0, 0.25)).toBeCloseTo(0.25);
    const mirrored: Layer = {...ramp, warps: [{type: 'mirror', angle: 90}]};
    expect(layerAt(mirrored, -0.25, 0)).toBeCloseTo(0.25);
  });
});

describe('expandCopies', () => {
  it('adds a turned copy of every layer', () => {
    const layers = expandCopies({layers: [ramp], copies: [90]});
    expect(layers).toHaveLength(2);
    expect(layerAt(layers[1], 0, 0.25)).toBeCloseTo(0.25);
  });
});

describe('orthographic flutes', () => {
  const flute = {type: 'flute', angle: 0, period: 0.2, falloff: 1} as const;
  const source = {type: 'radial', x: 0.3, radius: 3} as const;
  const a: Layer = {ink: 'a', source, warps: [flute]};
  const b: Layer = {ink: 'b', source, warps: [{...flute, mirror: true}]};

  it('keep the sharp edge on the same side of every rib, on both sides of the centre', () => {
    for (const rib of [-3, -1, 0, 1, 3]) {
      const start = rib * 0.2;
      // a is lit hard where a rib starts and fades towards its end ...
      expect(layerAt(a, start + 0.001, 0)).toBeGreaterThan(layerAt(a, start + 0.199, 0) + 0.3);
      expect(layerAt(a, start - 0.001, 0)).toBeLessThan(0.05);
      // ... and b, mirrored, the other way round.
      expect(layerAt(b, start - 0.001, 0)).toBeGreaterThan(layerAt(b, start - 0.199, 0) + 0.3);
      expect(layerAt(b, start + 0.001, 0)).toBeLessThan(0.05);
    }
  });

  it('leave the plane in place, only dimming it', () => {
    expect(layerAt(a, 0.3, 0)).toBeCloseTo(0.5);
    expect(layerAt(b, 0.3, 0)).toBeCloseTo(0.5);
  });
});

describe('mirrored perspective flutes', () => {
  it('meet at rib lines: one ink ends a rib where the other starts the next', () => {
    const flute = {
      type: 'flute',
      angle: 0,
      period: 0.2,
      projection: 'perspective',
      scale: 4,
      shift: 2,
    } as const;
    const source = {type: 'radial', x: 0.9, radius: 3} as const;
    const a: Layer = {ink: 'a', source, warps: [flute]};
    const b: Layer = {ink: 'b', source, warps: [{...flute, scale: -4}]};
    // Within a rib, b reads what a reads at the mirrored position ...
    expect(layerAt(b, 0.25, 0)).toBeCloseTo(layerAt(a, 0.35, 0));
    // ... so at a rib line, b ends one rib and a starts the next on neighbouring
    // rib centres: nearly the same value, with both sharp edges meeting there.
    expect(Math.abs(layerAt(b, 0.3999, 0) - layerAt(a, 0.4001, 0))).toBeLessThan(0.1);
  });
});

describe('densitiesAt', () => {
  const half: Layer = {ink: 'a', source: {type: 'linear', angle: 0, from: 0, to: 1}};

  it('combines same-ink layers by blend mode and leaves the other ink empty', () => {
    expect(densitiesAt([half, half], 0.5, 0, 'screen')).toEqual({a: 0.75, b: 0});
    expect(densitiesAt([half, half], 0.5, 0, 'max').a).toBeCloseTo(0.5);
    expect(densitiesAt([half, half], 0.5, 0, 'multiply').a).toBeCloseTo(0.25);
  });

  it("keeps the presets' densities within 0 and 1", () => {
    for (const pattern of [gridPattern, stripePattern]) {
      for (let x = -1.2; x <= 1.2; x += 0.037) {
        for (let y = -1; y <= 1; y += 0.041) {
          const d = densitiesAt(pattern.layers, x, y, pattern.blend);
          for (const v of [d.a, d.b]) {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });
});

describe('stipple', () => {
  it('places the same dots wherever the sampled rectangle falls', () => {
    const whole = new Set(collect(gridPattern, -0.4, -0.4, 0.4, 0.4).map(key));
    const part = collect(gridPattern, -0.1, -0.2, 0.3, 0.1);
    expect(part.length).toBeGreaterThan(100);
    for (const dot of part) expect(whole.has(key(dot))).toBe(true);
  });

  it('changes the dots with the seed', () => {
    const a = collect(stripePattern, -0.2, -0.2, 0.2, 0.2).map(key);
    const b = collect({...stripePattern, seed: 99}, -0.2, -0.2, 0.2, 0.2).map(key);
    expect(a).not.toEqual(b);
  });

  it('puts at most one dot in each cell when sampling is shared', () => {
    const pattern: StipplePattern = {
      ...gridPattern,
      gain: 10,
      sampling: 'shared',
      points: 'grid',
    };
    const dots = collect(pattern, -0.3, -0.3, 0.3, 0.3);
    const cells = new Set(dots.map((d) => `${Math.floor(d.x / pattern.spacing)},${Math.floor(d.y / pattern.spacing)}`));
    expect(cells.size).toBe(dots.length);
  });

  it('puts at most one dot on each blue-noise point when sampling is shared', () => {
    const pattern: StipplePattern = {...gridPattern, gain: 10, sampling: 'shared'};
    const dots = collect(pattern, -0.3, -0.3, 0.3, 0.3).map((d) => `${d.x},${d.y}`);
    expect(new Set(dots).size).toBe(dots.length);
  });
});

describe('blueNoiseTile', () => {
  // Smallest wrap-around distance between the first `n` points, in cells.
  const minDistance = (tile: Float64Array, n: number) => {
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = Math.abs(tile[2 * i] - tile[2 * j]);
        let dy = Math.abs(tile[2 * i + 1] - tile[2 * j + 1]);
        dx = Math.min(dx, 64 - dx);
        dy = Math.min(dy, 64 - dy);
        best = Math.min(best, Math.hypot(dx, dy));
      }
    }
    return best;
  };

  it('spreads every prefix evenly, so sparse regions have no clumps', () => {
    const tile = blueNoiseTile(1);
    expect(tile.length).toBe(64 * 64 * 2);
    // n points evenly spread on the 64×64 tile sit about 64/√n apart; white
    // noise would put some almost on top of each other.
    for (const n of [64, 256, 1024]) {
      expect(minDistance(tile, n)).toBeGreaterThan(0.5 * (64 / Math.sqrt(n)));
    }
  });
});

describe('gridAnglesPattern', () => {
  it('gives each of its four gradient centres its own fluting angle', () => {
    const pattern = gridAnglesPattern([10, 20, 30, 40]);
    const angles = pattern.layers.map((layer) => (layer.warps ?? []).find((warp) => warp.type === 'flute'));
    expect(angles.map((flute) => (flute?.type === 'flute' ? flute.angle : undefined))).toEqual([10, 20, 30, 40]);
    const centres = new Set(
      pattern.layers.map((layer) => (layer.source.type === 'radial' ? `${layer.source.x},${layer.source.y}` : '')),
    );
    expect(centres.size).toBe(4);
  });
});

describe('image sources', () => {
  // 2 × 2 pixels: dense on the left column, empty on the right.
  const images = {half: {width: 2, height: 2, data: [255, 0, 255, 0]}};
  const layer: Layer = {ink: 'a', source: {type: 'image', image: 'half', height: 2}};

  it('reads pixel densities over the image, 0 outside it and without a bitmap', () => {
    // Two pattern units tall and wide, centred on the origin: pixel centres at ±0.5.
    expect(layerAt(layer, -0.5, -0.5, images)).toBe(1);
    expect(layerAt(layer, 0.5, 0.5, images)).toBe(0);
    expect(layerAt(layer, 0, 0, images)).toBeCloseTo(0.5);
    expect(layerAt(layer, -1.5, 0, images)).toBe(0);
    expect(layerAt(layer, -0.5, 0)).toBe(0);
    const inverted: Layer = {...layer, source: {type: 'image', image: 'half', height: 2, invert: true}};
    expect(layerAt(inverted, 0.5, 0.5, images)).toBe(1);
  });

  it('places and scales the image', () => {
    const moved: Layer = {ink: 'a', source: {type: 'image', image: 'half', x: 1, y: 0, height: 1}};
    expect(layerAt(moved, 0.75, 0.25, images)).toBe(1);
    expect(layerAt(moved, 1.25, 0.25, images)).toBe(0);
    expect(layerAt(moved, 0.25, 0, images)).toBe(0);
  });

  it('turns RGBA into darkness times opacity', () => {
    const img = imageDensities(3, 1, [0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0]);
    expect(Array.from(img.data)).toEqual([255, 0, 0]);
  });

  it('stipples each ink from its own image', () => {
    const pattern: StipplePattern = {
      ...imagePattern,
      spacing: 0.02,
      // One unit tall, so the 2 × 1 images span x = -1 to 1.
      layers: imagePattern.layers.map((layer) => ({...layer, source: {...layer.source, height: 1} as Layer['source']})),
      images: {a: {width: 2, height: 1, data: [255, 0]}, b: {width: 2, height: 1, data: [0, 255]}},
    };
    const dots = collect(pattern, -1, -0.5, 1, 0.5);
    const a = dots.filter((dot) => dot.ink === 'a');
    const b = dots.filter((dot) => dot.ink === 'b');
    expect(a.length).toBeGreaterThan(100);
    expect(b.length).toBeGreaterThan(100);
    // Inner halves are well clear of the bilinear blend at x = 0.
    expect(a.filter((dot) => dot.x > 0.5)).toHaveLength(0);
    expect(b.filter((dot) => dot.x < -0.5)).toHaveLength(0);
  });
});

describe('more than two inks', () => {
  const band = (ink: string, from: number): Layer => ({
    ink,
    source: {type: 'image', image: ink, x: from + 0.25, height: 1},
  });
  const solid = {width: 1, height: 2, data: [255, 255]};
  const pattern: StipplePattern = {
    ...imagePattern,
    spacing: 0.02,
    inks: {a: '#000', b: '#111', c: '#222', d: '#333'},
    // One half-unit-wide band per ink, side by side.
    layers: [band('a', -1), band('b', -0.5), band('c', 0), band('d', 0.5)],
    images: {a: solid, b: solid, c: solid, d: solid},
  };

  it('stipples every ink in its own place', () => {
    const dots = collect(pattern, -1, -0.5, 1, 0.5);
    for (const [ink, from] of [['a', -1], ['b', -0.5], ['c', 0], ['d', 0.5]] as const) {
      const own = dots.filter((dot) => dot.ink === ink);
      expect(own.length).toBeGreaterThan(50);
      expect(own.filter((dot) => dot.x < from - 0.01 || dot.x > from + 0.51)).toHaveLength(0);
    }
  });

  it('shares points between all inks when asked', () => {
    const dots = collect({...pattern, sampling: 'shared'}, -1, -0.5, 1, 0.5);
    expect(new Set(dots.map((dot) => dot.ink)).size).toBe(4);
    expect(new Set(dots.map((dot) => `${dot.x},${dot.y}`)).size).toBe(dots.length);
  });

  it('adding an ink leaves the others where they were', () => {
    const two = {...stripePattern, spacing: 0.02};
    const three: StipplePattern = {
      ...two,
      inks: {...two.inks, c: '#f00'},
      layers: [...two.layers, {ink: 'c', source: {type: 'radial', radius: 1}}],
    };
    const before = collect(two, -1, -1, 1, 1).map(key);
    const after = collect(three, -1, -1, 1, 1).filter((dot) => dot.ink !== 'c').map(key);
    expect(after).toEqual(before);
  });

  it('densitiesAt reports every ink the layers use', () => {
    expect(Object.keys(densitiesAt(pattern.layers, 0, 0, 'screen', pattern.images))).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('per-ink settings', () => {
  const base: StipplePattern = {
    ...imagePattern,
    spacing: 0.02,
    images: {a: {width: 1, height: 1, data: [128]}, b: {width: 1, height: 1, data: [128]}},
  };
  const count = (pattern: StipplePattern, ink: string) =>
    collect(pattern, -1, -1, 1, 1).filter((dot) => dot.ink === ink).length;

  it('an ink with its own spacing, gain or seed changes only its own dots', () => {
    const before = collect(base, -1, -1, 1, 1);
    const finer: StipplePattern = {...base, inks: {...base.inks, b: {color: '#000', spacing: 0.01, seed: 9}}};
    const after = collect(finer, -1, -1, 1, 1);
    expect(after.filter((dot) => dot.ink === 'a').map(key)).toEqual(before.filter((dot) => dot.ink === 'a').map(key));
    expect(count(finer, 'b')).toBeGreaterThan(3 * count(base, 'b'));
    const dimmer: StipplePattern = {...base, inks: {...base.inks, a: {color: '#000', gain: 0.5}}};
    expect(count(dimmer, 'a')).toBeLessThan(0.7 * count(base, 'a'));
  });

  it('an ink style with no settings of its own draws like a plain colour', () => {
    const styled: StipplePattern = {...base, inks: {a: {color: '#123'}, b: {color: '#456'}}};
    expect(collect(styled, -1, -1, 1, 1).map(key)).toEqual(collect(base, -1, -1, 1, 1).map(key));
  });
});
