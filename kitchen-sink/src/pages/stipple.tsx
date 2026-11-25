import {useEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {
  drawStipple,
  gridAnglesPattern,
  gridPattern,
  heroPattern,
  imageDensities,
  imagePattern,
  jazzInks,
  StippleCanvas,
  stripePattern,
  type Flute,
  type Layer,
  type Source,
  type StippleImage,
  type StipplePattern,
} from '../../../stipple/index.ts';

const presets: Record<string, StipplePattern> = {
  stripes: stripePattern,
  grid: gridPattern,
  'grid, 4 angles': gridAnglesPattern(),
  hero: heroPattern,
  'image per ink': imagePattern,
};

type ImageSource = Extract<Source, {type: 'image'}>;

/** Longest side images are scaled down to: plenty for dots a few px apart. */
const MAX_IMAGE_SIDE = 1600;

/** Reads a picked file into image-source densities (dark and opaque = dense). */
async function loadImage(file: File): Promise<StippleImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', {willReadFrequently: true})!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return imageDensities(width, height, ctx.getImageData(0, 0, width, height).data);
}

/** Placeholder images until you pick your own: a soft disc for ink 1, a ring for ink 2. */
function placeholderImages(): Record<string, StippleImage> {
  const draw = (paint: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 400;
    const ctx = canvas.getContext('2d', {willReadFrequently: true})!;
    paint(ctx);
    return imageDensities(400, 400, ctx.getImageData(0, 0, 400, 400).data);
  };
  return {
    a: draw((ctx) => {
      const g = ctx.createRadialGradient(160, 170, 0, 160, 170, 150);
      g.addColorStop(0, '#000');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 400, 400);
    }),
    b: draw((ctx) => {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 40;
      ctx.beginPath();
      ctx.arc(240, 230, 120, 0, Math.PI * 2);
      ctx.stroke();
    }),
  };
}

const imageSourcesOf = (pattern: StipplePattern) =>
  pattern.layers.map((layer) => layer.source).filter((source): source is ImageSource => source.type === 'image');

type SourceKind = 'radial' | 'linear' | 'image' | 'mixed' | 'none';

/** What an ink reads from: one kind of source, several ("mixed", as some presets do), or none yet. */
function sourceKindOf(pattern: StipplePattern, ink: string): SourceKind {
  const kinds = new Set(pattern.layers.filter((layer) => layer.ink === ink).map((layer) => layer.source.type));
  if (kinds.size === 0) return 'none';
  if (kinds.size > 1) return 'mixed';
  const [kind] = kinds;
  return kind === 'radial' && pattern.layers.filter((layer) => layer.ink === ink).length > 1 ? 'mixed' : kind;
}

/**
 * Gives an ink a single layer of the chosen kind, in place of its layers.
 * Fluting and other warps of its first layer stay; images are named after
 * the ink.
 */
function setInkSource(pattern: StipplePattern, ink: string, kind: SourceKind): StipplePattern {
  if (kind === 'mixed' || kind === 'none') return pattern;
  const first = pattern.layers.find((layer) => layer.ink === ink);
  const at = first?.source.type === 'linear' ? {} : {x: first?.source.x ?? 0, y: first?.source.y ?? 0};
  const source: Source =
    kind === 'radial'
      ? {type: 'radial', x: 0, y: 0, ...at, radius: 1.4, gamma: 1.4}
      : kind === 'linear'
        ? {type: 'linear', angle: 0, from: -1, to: 1}
        : {type: 'image', image: ink, x: 0, y: 0, ...at, height: imageSourcesOf(pattern)[0]?.height ?? 2};
  const layer: Layer = {ink, source, ...(first?.warps ? {warps: first.warps} : {})};
  const index = pattern.layers.findIndex((l) => l.ink === ink);
  const rest = pattern.layers.filter((l) => l.ink !== ink);
  return {...pattern, layers: index < 0 ? [...rest, layer] : [...rest.slice(0, index), layer, ...rest.slice(index)]};
}

/** Colours for added inks, in turn. */
const extraInkColours = ['#ff5c8a', '#ffb020', '#a855f7', '#ffffff', '#111111'];

/** Adds an ink (named c, d, …) with a gradient of its own, painted over the others. */
function addInk(pattern: StipplePattern): StipplePattern {
  const names = Object.keys(pattern.inks);
  let code = 'c'.charCodeAt(0);
  while (names.includes(String.fromCharCode(code))) code++;
  const ink = String.fromCharCode(code);
  const colour = extraInkColours[(names.length - 2 + extraInkColours.length) % extraInkColours.length];
  // Image presets get another image ink, anything else a gradient.
  const kind = imageSourcesOf(pattern).length ? 'image' : 'radial';
  return setInkSource({...pattern, inks: {...pattern.inks, [ink]: colour}}, ink, kind);
}

function removeInk(pattern: StipplePattern, ink: string): StipplePattern {
  const {[ink]: _, ...inks} = pattern.inks;
  return {...pattern, inks, layers: pattern.layers.filter((layer) => layer.ink !== ink)};
}

function setImageSources(pattern: StipplePattern, update: Partial<ImageSource>): StipplePattern {
  return {
    ...pattern,
    layers: pattern.layers.map((layer) =>
      layer.source.type === 'image' ? {...layer, source: {...layer.source, ...update}} : layer,
    ),
  };
}

const sliders = [
  {key: 'spacing', min: 0.002, max: 0.03, step: 0.0005},
  {key: 'radius', min: 0.0005, max: 0.015, step: 0.0005},
  {key: 'gain', min: 0.2, max: 4, step: 0.05},
  {key: 'jitter', min: 0, max: 1, step: 0.05},
  {key: 'seed', min: 1, max: 100, step: 1},
] as const;

const backgrounds = {dark: '#000000', light: '#f5f5f4', none: 'transparent'};
type Background = keyof typeof backgrounds;

/**
 * The brand inks for a background, as the docs hero uses them: mint and the
 * logo blue, with a brighter mint on dark. A transparent background gets the
 * light-scheme inks, as presets.ts does.
 */
const brandInks = (background: Background) => jazzInks[background === 'dark' ? 'dark' : 'light'];
const isBrandInks = (inks: StipplePattern['inks']) =>
  Object.values(jazzInks).some((brand) => brand.a === inks.a && brand.b === inks.b);
const withBrandInks = (pattern: StipplePattern, background: Background): StipplePattern => ({
  ...pattern,
  inks: {...pattern.inks, ...brandInks(background)},
});

const flutesOf = (pattern: StipplePattern) =>
  pattern.layers.flatMap((layer) => (layer.warps ?? []).filter((warp): warp is Flute => warp.type === 'flute'));

/**
 * Sets a flute setting on every layer at once, keeping each layer's sign for
 * scale and shift so mirrored inks stay mirrored and ribs stay aligned. The
 * angle turns all flutes together, so a grid's two directions stay crossed.
 */
function setFlutes(pattern: StipplePattern, key: keyof Flute, value: number): StipplePattern {
  const signed = key === 'scale' || key === 'shift';
  const turn = key === 'angle' ? value - (flutesOf(pattern)[0]?.angle ?? 0) : 0;
  return mapFlutes(pattern, (flute) => {
    if (key === 'angle') return {...flute, angle: flute.angle + turn};
    const sign = signed && ((flute[key] as number | undefined) ?? 1) < 0 ? -1 : 1;
    return {...flute, [key]: sign * value};
  });
}

/** Ribs repeat along the flute's angle: 0° is x, 90° is y. */
const axisName = (angle: number) =>
  (({0: 'x', 90: 'y'}) as Record<number, string>)[((angle % 180) + 180) % 180] ?? `at ${angle}°`;

/** The distinct flute directions, each with its own width. */
const directionsOf = (pattern: StipplePattern) => [
  ...new Map(flutesOf(pattern).map((flute) => [flute.angle, flute.period])).entries(),
];

function mapFlutes(pattern: StipplePattern, update: (flute: Flute) => Flute): StipplePattern {
  return {
    ...pattern,
    layers: pattern.layers.map((layer) => ({
      ...layer,
      warps: layer.warps?.map((warp) => (warp.type === 'flute' ? update(warp) : warp)),
    })),
  };
}

/** Turns the flutes of one layer (one gradient centre) only. */
function setLayerAngle(pattern: StipplePattern, index: number, angle: number): StipplePattern {
  return {
    ...pattern,
    layers: pattern.layers.map((layer, i) =>
      i === index
        ? {...layer, warps: layer.warps?.map((warp) => (warp.type === 'flute' ? {...warp, angle} : warp))}
        : layer,
    ),
  };
}

function setRadials(pattern: StipplePattern, key: 'radius' | 'gamma', value: number): StipplePattern {
  return {
    ...pattern,
    layers: pattern.layers.map((layer) =>
      layer.source.type === 'radial' ? {...layer, source: {...layer.source, [key]: value}} : layer,
    ),
  };
}

type Projection = NonNullable<Flute['projection']>;

const fluteSliders = [
  {key: 'angle', label: 'Fluting angle', min: 0, max: 180, step: 1},
  {key: 'falloff', label: 'Fluting falloff', min: 0.1, max: 6, step: 0.1, only: 'orthographic'},
  {key: 'scale', label: 'Fluting strength', min: 0, max: 30, step: 0.25, only: 'perspective'},
  {key: 'shift', label: 'Fluting offset', min: 0, max: 15, step: 0.25, only: 'perspective'},
  {key: 'bend', label: 'Fluting bend', min: -1, max: 2, step: 0.05, only: 'perspective'},
] as const satisfies {
  key: keyof Flute;
  label: string;
  min: number;
  max: number;
  step: number;
  only?: Projection;
}[];

const defaultFluteValue = {falloff: 1, scale: 1} as Partial<Record<keyof Flute, number>>;

const radialSliders = [
  {key: 'radius', label: 'Gradient radius', min: 0.2, max: 4, step: 0.05},
  {key: 'gamma', label: 'Gradient falloff', min: 0.2, max: 5, step: 0.05},
] as const;

/** Draggable dot per radial gradient centre, in the canvas's pattern units. */
/** "#abc", "abc", "#aabbcc" or "aabbcc" as "#aabbcc"; undefined if it isn't a hex colour. */
function parseHex(text: string): string | undefined {
  const hex = text.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  if (/^[0-9a-f]{3}$/.test(hex)) return `#${[...hex].map((c) => c + c).join('')}`;
  return undefined;
}

/** A hex text field for a colour: applies as soon as what you type is a valid colour. */
function HexInput({value, label, onChange}: {value: string; label: string; onChange: (hex: string) => void}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (parseHex(draft) !== parseHex(value)) setDraft(value);
  }, [value]);
  const valid = parseHex(draft) !== undefined;
  return (
    <input
      type="text"
      className="ks-stipple-hex"
      aria-label={label}
      aria-invalid={!valid}
      spellCheck={false}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        const hex = parseHex(event.target.value);
        if (hex) onChange(hex);
      }}
      onBlur={() => setDraft(value)}
    />
  );
}

function CentreHandles({
  pattern,
  onMove,
}: {
  pattern: StipplePattern;
  onMove: (index: number, x: number, y: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = (index: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (e: PointerEvent) => {
      const unit = box.height / 2;
      const x = (e.clientX - box.left - box.width / 2) / unit;
      const y = (e.clientY - box.top - box.height / 2) / unit;
      onMove(index, Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000);
    };
    const target = event.currentTarget;
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
  };
  return (
    <div ref={ref} className="ks-stipple-handles">
      {pattern.layers.map((layer: Layer, index) =>
        layer.source.type === 'radial' || layer.source.type === 'image' ? (
          <button
            key={index}
            type="button"
            aria-label={`Move ${layer.source.type === 'image' ? 'image' : 'gradient'} centre ${index + 1}`}
            className="ks-stipple-handle"
            style={{
              left: `calc(50% + ${layer.source.x ?? 0} * 50cqh)`,
              top: `calc(50% + ${layer.source.y ?? 0} * 50cqh)`,
              background: pattern.inks[layer.ink],
            }}
            onPointerDown={drag(index)}
          >
            {index + 1}
          </button>
        ) : null,
      )}
    </div>
  );
}

/** Tunes stipple patterns (stipple/) and exports them as images. */
export function StipplePage() {
  const [background, setBackground] = useState<Background>('dark');
  const [source, setSource] = useState(() => JSON.stringify(withBrandInks(stripePattern, 'dark'), null, 2));
  const [aspect, setAspect] = useState(1.1);
  const lastGood = useRef(withBrandInks(stripePattern, 'dark'));
  const {pattern, error} = useMemo(() => {
    try {
      lastGood.current = JSON.parse(source) as StipplePattern;
      return {pattern: lastGood.current, error: null};
    } catch (error) {
      return {pattern: lastGood.current, error: String(error)};
    }
  }, [source]);

  const [showHandles, setShowHandles] = useState(true);
  const commit = (next: StipplePattern) => setSource(JSON.stringify(next, null, 2));
  const update = (key: string, value: number) => commit({...pattern, [key]: value});
  const moveCentre = (index: number, x: number, y: number) =>
    commit({
      ...pattern,
      layers: pattern.layers.map((layer, i) =>
        i === index && (layer.source.type === 'radial' || layer.source.type === 'image')
          ? {...layer, source: {...layer.source, x, y}}
          : layer,
      ),
    });
  const flute = flutesOf(pattern)[0];
  const projection: Projection = flute?.projection ?? 'orthographic';
  const radial = pattern.layers.find((layer) => layer.source.type === 'radial')?.source;

  // Bitmaps live outside the JSON (they would swamp it); image sources name them.
  const [images, setImages] = useState<Record<string, StippleImage>>(placeholderImages);
  const [imageNames, setImageNames] = useState<Record<string, string>>({});
  const imageSources = imageSourcesOf(pattern);
  const imageSource = imageSources[0];
  const drawn = useMemo(() => (imageSources.length ? {...pattern, images} : pattern), [pattern, images]);
  const pickImage = async (name: string, file: File | undefined) => {
    if (!file) return;
    const image = await loadImage(file);
    setImages((current) => ({...current, [name]: image}));
    setImageNames((current) => ({...current, [name]: file.name}));
  };

  const exportPng = () => {
    const canvas = document.createElement('canvas');
    canvas.height = 3000;
    canvas.width = Math.round(3000 * aspect);
    drawStipple(canvas, drawn);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'stipple.png';
      link.click();
      URL.revokeObjectURL(link.href);
    });
  };

  return (
    <div className="ks-stipple">
      <div className="ks-stipple-column">
        <Heading level={1} type="display-3">
          Stipple patterns
        </Heading>
        <div
          className="ks-stipple-frame"
          style={{
            background: backgrounds[background],
            containerType: 'size',
            aspectRatio: aspect,
          }}
        >
          <StippleCanvas pattern={drawn} className="ks-stipple-canvas" />
          {showHandles && <CentreHandles pattern={pattern} onMove={moveCentre} />}
        </div>
        <Text as="p" display="block" color="secondary">
          Drag the round handles to move each ink's gradient centre. One pattern unit is half the image height. Each
          layer reads a gradient through its warps (fluted glass, mirror, rotate), in order from the page towards the
          source. The fluting and gradient sliders set every layer at once. Exports are 3000 px tall with a transparent
          background. Add inks and pick each one's source: a radial or linear gradient, or a monochrome image you pick
          (dark or opaque = dense). Later inks paint over earlier ones. Images are not part of the JSON.
        </Text>
      </div>
      <div className="ks-stipple-column">
        <label className="ks-stipple-field">
          <Text weight="medium">Preset</Text>
          <select
            className="ks-stipple-select"
            onChange={(event) => commit(withBrandInks(presets[event.target.value], background))}
          >
            {Object.keys(presets).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        {Object.keys(pattern.inks).map((ink, index, all) => {
          const kind = sourceKindOf(pattern, ink);
          const image = images[ink];
          return (
            <div key={ink} className="ks-stipple-ink-card">
              <div className="ks-stipple-row">
                <label className="ks-stipple-ink">
                  <input
                    type="color"
                    className="ks-stipple-swatch"
                    value={pattern.inks[ink]}
                    onChange={(event) => commit({...pattern, inks: {...pattern.inks, [ink]: event.target.value}})}
                  />
                  <Text weight="medium">Ink {index + 1}</Text>
                </label>
                <HexInput
                  label={`Hex colour for ink ${index + 1}`}
                  value={pattern.inks[ink]}
                  onChange={(hex) => commit({...pattern, inks: {...pattern.inks, [ink]: hex}})}
                />
                <select
                  className="ks-stipple-select ks-stipple-select-inline"
                  aria-label={`Source for ink ${index + 1}`}
                  value={kind}
                  onChange={(event) => commit(setInkSource(pattern, ink, event.target.value as SourceKind))}
                >
                  {kind === 'mixed' && <option value="mixed">as in the preset</option>}
                  {kind === 'none' && <option value="none">no source</option>}
                  <option value="radial">radial gradient</option>
                  <option value="linear">linear gradient</option>
                  <option value="image">image</option>
                </select>
                {all.length > 1 && (
                  <Button label="Remove" variant="secondary" onClick={() => commit(removeInk(pattern, ink))} />
                )}
              </div>
              {kind === 'image' && (
                <label className="ks-stipple-field">
                  <Text color="secondary">
                    {imageNames[ink] ?? (image ? 'placeholder' : 'pick a monochrome image')}
                    {image ? ` (${image.width}×${image.height})` : ''}
                  </Text>
                  <input type="file" accept="image/*" onChange={(event) => void pickImage(ink, event.target.files?.[0])} />
                </label>
              )}
              {kind === 'linear' &&
                pattern.layers.map((layer, i) =>
                  layer.ink === ink && layer.source.type === 'linear' ? (
                    <label key={i} className="ks-stipple-field">
                      <Text color="secondary">Gradient angle {layer.source.angle}°</Text>
                      <input
                        type="range"
                        className="ks-stipple-range"
                        min={0}
                        max={360}
                        step={1}
                        value={layer.source.angle}
                        onChange={(event) =>
                          commit({
                            ...pattern,
                            layers: pattern.layers.map((l, j) =>
                              j === i && l.source.type === 'linear'
                                ? {...l, source: {...l.source, angle: Number(event.target.value)}}
                                : l,
                            ),
                          })
                        }
                      />
                    </label>
                  ) : null,
                )}
            </div>
          );
        })}
        <div className="ks-stipple-row">
          <Button label="Add ink" variant="secondary" onClick={() => commit(addInk(pattern))} />
        </div>
        {imageSources.length > 0 && (
          <>
            <label className="ks-stipple-field">
              <Text weight="medium">Image height {imageSource.height ?? 2}</Text>
              <input
                type="range"
                className="ks-stipple-range"
                min={0.2}
                max={6}
                step={0.05}
                value={imageSource.height ?? 2}
                onChange={(event) => commit(setImageSources(pattern, {height: Number(event.target.value)}))}
              />
            </label>
            <label className="ks-stipple-field">
              <Text weight="medium">Image falloff {imageSource.gamma ?? 1}</Text>
              <input
                type="range"
                className="ks-stipple-range"
                min={0.2}
                max={5}
                step={0.05}
                value={imageSource.gamma ?? 1}
                onChange={(event) => commit(setImageSources(pattern, {gamma: Number(event.target.value)}))}
              />
            </label>
            <div className="ks-stipple-row">
              <Button
                label={imageSource.invert ? 'Dark is empty' : 'Dark is dense'}
                variant="secondary"
                onClick={() => commit(setImageSources(pattern, {invert: !imageSource.invert}))}
              />
              {images[imageSource.image] && (
                <Button
                  label="Match aspect to image"
                  variant="secondary"
                  onClick={() => {
                    const image = images[imageSource.image];
                    setAspect(Math.min(2.5, Math.max(0.4, Math.round((image.width / image.height) * 20) / 20)));
                    commit(setImageSources(pattern, {x: 0, y: 0, height: 2}));
                  }}
                />
              )}
            </div>
          </>
        )}
        {(
          [
            ['blend', ['screen', 'max', 'multiply']],
            ['sampling', ['independent', 'shared']],
            ['points', ['grid', 'blue-noise']],
          ] as const
        ).map(([key, options]) => (
          <label key={key} className="ks-stipple-field">
            <Text weight="medium">{key}</Text>
            <select
              className="ks-stipple-select"
              value={pattern[key] ?? options[0]}
              onChange={(event) => setSource(JSON.stringify({...pattern, [key]: event.target.value}, null, 2))}
            >
              {options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
        {flute && (
          <label className="ks-stipple-field">
            <Text weight="medium">Fluting projection</Text>
            <select
              className="ks-stipple-select"
              value={projection}
              onChange={(event) =>
                commit(
                  mapFlutes(pattern, (f) => ({
                    ...f,
                    projection: event.target.value as Projection,
                  })),
                )
              }
            >
              <option>orthographic</option>
              <option>perspective</option>
            </select>
          </label>
        )}
        {flute && projection === 'orthographic' && (
          <Button
            label="Swap sharp edges"
            variant="secondary"
            onClick={() => commit(mapFlutes(pattern, (f) => ({...f, mirror: !f.mirror})))}
          />
        )}
        {directionsOf(pattern).map(([angle, period], _, all) => (
          <label key={angle} className="ks-stipple-field">
            <Text weight="medium">
              Fluting width{all.length > 1 ? ` ${axisName(angle)}` : ''} {period}
            </Text>
            <input
              type="range"
              className="ks-stipple-range"
              min={0.02}
              max={0.5}
              step={0.005}
              value={period}
              onChange={(event) =>
                commit(mapFlutes(pattern, (f) => (f.angle === angle ? {...f, period: Number(event.target.value)} : f)))
              }
            />
          </label>
        ))}
        {flute &&
          fluteSliders.map(({key, label, min, max, step, ...rest}) =>
            'only' in rest && rest.only !== projection ? null : (
              <label key={key} className="ks-stipple-field">
                <Text weight="medium">
                  {label} {Math.abs(flute[key] ?? defaultFluteValue[key] ?? 0)}
                </Text>
                <input
                  type="range"
                  className="ks-stipple-range"
                  min={min}
                  max={max}
                  step={step}
                  value={Math.abs(flute[key] ?? defaultFluteValue[key] ?? 0)}
                  onChange={(event) => commit(setFlutes(pattern, key, Number(event.target.value)))}
                />
              </label>
            ),
          )}
        {pattern.layers.length > 1 &&
          pattern.layers.map((layer, index) => {
            const own = (layer.warps ?? []).find((warp): warp is Flute => warp.type === 'flute');
            return own ? (
              <label key={`angle-${index}`} className="ks-stipple-field">
                <Text weight="medium">
                  <span className="ks-stipple-dot" style={{background: pattern.inks[layer.ink]}} />
                  Angle at centre {index + 1}: {own.angle}°
                </Text>
                <input
                  type="range"
                  className="ks-stipple-range"
                  min={0}
                  max={180}
                  step={1}
                  value={own.angle}
                  onChange={(event) => commit(setLayerAngle(pattern, index, Number(event.target.value)))}
                />
              </label>
            ) : null;
          })}
        {radial?.type === 'radial' &&
          radialSliders.map(({key, label, min, max, step}) => (
            <label key={key} className="ks-stipple-field">
              <Text weight="medium">
                {label} {radial[key] ?? 1}
              </Text>
              <input
                type="range"
                className="ks-stipple-range"
                min={min}
                max={max}
                step={step}
                value={radial[key] ?? 1}
                onChange={(event) => commit(setRadials(pattern, key, Number(event.target.value)))}
              />
            </label>
          ))}
        {sliders.map(({key, min, max, step}) => (
          <label key={key} className="ks-stipple-field">
            <Text weight="medium">
              {key} {pattern[key] ?? ''}
            </Text>
            <input
              type="range"
              className="ks-stipple-range"
              min={min}
              max={max}
              step={step}
              value={pattern[key] ?? (key === 'seed' ? 1 : key === 'jitter' || key === 'gain' ? 1 : 0)}
              onChange={(event) => update(key, Number(event.target.value))}
            />
          </label>
        ))}
        <label className="ks-stipple-field">
          <Text weight="medium">Aspect {aspect}</Text>
          <input
            type="range"
            className="ks-stipple-range"
            min={0.4}
            max={2.5}
            step={0.05}
            value={aspect}
            onChange={(event) => setAspect(Number(event.target.value))}
          />
        </label>
        <div className="ks-stipple-row">
          {(Object.keys(backgrounds) as Background[]).map((name) => (
            <Button
              key={name}
              label={`${name} background`}
              variant={background === name ? 'primary' : 'secondary'}
              onClick={() => {
                setBackground(name);
                // Brand inks follow the background, as on the docs hero; inks you picked stay.
                if (isBrandInks(pattern.inks)) commit(withBrandInks(pattern, name));
              }}
            />
          ))}
          <Button
            label={showHandles ? 'Hide handles' : 'Show handles'}
            variant="secondary"
            onClick={() => setShowHandles(!showHandles)}
          />
          <Button label="Export PNG" onClick={exportPng} />
          <Button label="Copy JSON" variant="secondary" onClick={() => navigator.clipboard.writeText(source)} />
        </div>
        <textarea
          className="ks-stipple-json"
          spellCheck={false}
          value={source}
          onChange={(event) => setSource(event.target.value)}
        />
        {error && (
          <Text as="p" display="block" color="secondary">
            {error}
          </Text>
        )}
      </div>
    </div>
  );
}
