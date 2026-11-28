import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {zip} from '../zip';
import {
  drawStipple,
  drawStipplePlates,
  gridAnglesPattern,
  gridPattern,
  heroPattern,
  imageDensities,
  imagePattern,
  inkColor,
  jazzInks,
  resolveInk,
  StippleCanvas,
  stripePattern,
  type Blend,
  type Flute,
  type InkStyle,
  type Layer,
  type Source,
  type StippleImage,
  type StipplePattern,
} from '../../../stipple/index.ts';

// The stipple generator: every setting belongs to one ink (its colour, its
// dots, and the layers it reads its density from), except the few that are
// about the whole picture (preset, sampling, aspect, background).

const presets: Record<string, StipplePattern> = {
  stripes: stripePattern,
  grid: gridPattern,
  'grid, 4 angles': gridAnglesPattern(),
  hero: heroPattern,
  'image per ink': imagePattern,
};

const backgrounds = {dark: '#000000', light: '#f5f5f4', none: 'transparent'};
type Background = keyof typeof backgrounds;

/* ---------- Inks ---------- */

const asStyle = (ink: string | InkStyle | undefined): InkStyle =>
  typeof ink === 'string' ? {color: ink} : (ink ?? {color: '#000000'});

/** Sets some of one ink's own settings, leaving the rest as they were. */
function setInk(pattern: StipplePattern, ink: string, patch: Partial<InkStyle>): StipplePattern {
  const current = pattern.inks[ink];
  // A plain colour stays a plain colour until the ink gets a setting of its own.
  const next = typeof current === 'string' && Object.keys(patch).every((k) => k === 'color') ? patch.color! : {...asStyle(current), ...patch};
  return {...pattern, inks: {...pattern.inks, [ink]: next}};
}

/**
 * The brand inks for a background, as the docs hero uses them: mint and the
 * logo blue, with a brighter mint on dark. A transparent background gets the
 * light-scheme inks, as presets.ts does.
 */
const brandInks = (background: Background) => jazzInks[background === 'dark' ? 'dark' : 'light'];
const hasBrandInks = (pattern: StipplePattern) =>
  Object.values(jazzInks).some(
    (brand) => inkColor(pattern, 'a') === brand.a && inkColor(pattern, 'b') === brand.b,
  );
const withBrandInks = (pattern: StipplePattern, background: Background): StipplePattern => {
  const brand = brandInks(background);
  return setInk(setInk(pattern, 'a', {color: brand.a}), 'b', {color: brand.b});
};

/** Colours for added inks, in turn. */
const extraInkColours = ['#ff5c8a', '#ffb020', '#a855f7', '#ffffff', '#111111'];

/** Adds an ink (named c, d, …) with one layer of its own, painted over the others. */
function addInk(pattern: StipplePattern): StipplePattern {
  const names = Object.keys(pattern.inks);
  let code = 'c'.charCodeAt(0);
  while (names.includes(String.fromCharCode(code))) code++;
  const ink = String.fromCharCode(code);
  const colour = extraInkColours[(names.length + extraInkColours.length - 2) % extraInkColours.length];
  const withInk = {...pattern, inks: {...pattern.inks, [ink]: colour}};
  // Image patterns get another image ink, anything else a gradient.
  const kind = pattern.layers.some((layer) => layer.source.type === 'image') ? 'image' : 'radial';
  return {...withInk, layers: [...pattern.layers, {ink, source: newSource(withInk, ink, kind)}]};
}

function removeInk(pattern: StipplePattern, ink: string): StipplePattern {
  const {[ink]: _, ...inks} = pattern.inks;
  return {...pattern, inks, layers: pattern.layers.filter((layer) => layer.ink !== ink)};
}

/* ---------- Layers ---------- */

type SourceKind = Source['type'];
type ImageSource = Extract<Source, {type: 'image'}>;

function updateLayer(pattern: StipplePattern, index: number, update: (layer: Layer) => Layer): StipplePattern {
  return {...pattern, layers: pattern.layers.map((layer, i) => (i === index ? update(layer) : layer))};
}

function updateSource(pattern: StipplePattern, index: number, patch: Record<string, unknown>): StipplePattern {
  return updateLayer(pattern, index, (layer) => ({...layer, source: {...layer.source, ...patch} as Source}));
}

/** A name for an ink's image that no other layer uses yet: the ink's own, then "c2", "c3", … */
function freeImageName(pattern: StipplePattern, ink: string, except?: number) {
  const taken = new Set(
    pattern.layers.flatMap((layer, i) => (i !== except && layer.source.type === 'image' ? [layer.source.image] : [])),
  );
  if (!taken.has(ink)) return ink;
  let n = 2;
  while (taken.has(`${ink}${n}`)) n++;
  return `${ink}${n}`;
}

function newSource(pattern: StipplePattern, ink: string, kind: SourceKind, at?: {x?: number; y?: number}, index?: number): Source {
  const x = at?.x ?? 0;
  const y = at?.y ?? 0;
  if (kind === 'radial') return {type: 'radial', x, y, radius: 1.4, gamma: 1.4};
  if (kind === 'linear') return {type: 'linear', angle: 0, from: -1, to: 1};
  return {type: 'image', image: freeImageName(pattern, ink, index), x, y, height: 2};
}

/** Swaps a layer's source for a fresh one of another kind, keeping where it is and its fluting. */
function setSourceKind(pattern: StipplePattern, index: number, kind: SourceKind): StipplePattern {
  const layer = pattern.layers[index];
  const at = layer.source.type === 'linear' ? undefined : layer.source;
  return updateLayer(pattern, index, (l) => ({...l, source: newSource(pattern, l.ink, kind, at, index)}));
}

function addLayer(pattern: StipplePattern, ink: string): StipplePattern {
  const last = [...pattern.layers].reverse().find((layer) => layer.ink === ink);
  const kind = last?.source.type ?? 'radial';
  // After the ink's last layer, so layers stay grouped by ink.
  const at = pattern.layers.lastIndexOf(last!) + 1 || pattern.layers.length;
  const layer: Layer = {ink, source: newSource(pattern, ink, kind, {x: 0.2, y: 0.2}), ...(last?.warps && {warps: last.warps})};
  return {...pattern, layers: [...pattern.layers.slice(0, at), layer, ...pattern.layers.slice(at)]};
}

const fluteOf = (layer: Layer) => layer.warps?.find((warp): warp is Flute => warp.type === 'flute');

/** Sets (or with undefined, removes) a layer's fluted glass, keeping its other warps. */
function setFlute(layer: Layer, flute: Flute | undefined): Layer {
  const warps = layer.warps ?? [];
  const at = warps.findIndex((warp) => warp.type === 'flute');
  const next =
    at < 0
      ? flute
        ? [...warps, flute]
        : warps
      : flute
        ? warps.map((warp, i) => (i === at ? flute : warp))
        : warps.filter((_, i) => i !== at);
  const {warps: _, ...rest} = layer;
  return next.length ? {...rest, warps: next} : rest;
}

/* ---------- Images ---------- */

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

/* ---------- Export ---------- */

/** Exports are this many pixels tall; the width follows the aspect. */
const EXPORT_HEIGHT = 3000;

function download(blob: Blob, name: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

const pngOf = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject()), 'image/png'));

/** "stipple-ink-2-146aff.png": number and colour, so plates are easy to tell apart. */
const plateName = (pattern: StipplePattern, ink: string) =>
  `stipple-ink-${Object.keys(pattern.inks).indexOf(ink) + 1}-${inkColor(pattern, ink).replace(/[^0-9a-z]/gi, '')}.png`;

/**
 * Downloads one PNG per ink (the given inks, or all of them in a zip), each
 * on a transparent background and registered with the full export.
 */
async function exportPlates(pattern: StipplePattern, aspect: number, only?: string) {
  const plates = drawStipplePlates(pattern, Math.round(EXPORT_HEIGHT * aspect), EXPORT_HEIGHT);
  if (only) return download(await pngOf(plates[only]), plateName(pattern, only));
  const files = await Promise.all(
    Object.entries(plates).map(async ([ink, canvas]) => ({
      name: plateName(pattern, ink),
      data: new Uint8Array(await (await pngOf(canvas)).arrayBuffer()),
    })),
  );
  download(zip(files), 'stipple-inks.zip');
}

/* ---------- Controls ---------- */

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="ks-stipple-field">
      <Text size="sm">
        {label} <span className="ks-stipple-value">{value}</span>
      </Text>
      <input
        type="range"
        className="ks-stipple-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (T | readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="ks-stipple-field">
      <Text size="sm">{label}</Text>
      <select className="ks-stipple-select" value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => {
          const [v, text] = typeof option === 'string' ? [option, option] : option;
          return (
            <option key={v} value={v}>
              {text}
            </option>
          );
        })}
      </select>
    </label>
  );
}

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

function Group({title, children}: {title: string; children: ReactNode}) {
  return (
    <div className="ks-stipple-group">
      <Text size="sm" weight="medium" color="secondary">
        {title}
      </Text>
      {children}
    </div>
  );
}

/** Draggable dot per radial gradient or image centre, in the canvas's pattern units. */
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
        layer.source.type === 'linear' ? null : (
          <button
            key={index}
            type="button"
            aria-label={`Move the centre of layer ${index + 1}`}
            className="ks-stipple-handle"
            style={{
              left: `calc(50% + ${layer.source.x ?? 0} * 50cqh)`,
              top: `calc(50% + ${layer.source.y ?? 0} * 50cqh)`,
              background: inkColor(pattern, layer.ink),
            }}
            onPointerDown={drag(index)}
          >
            {index + 1}
          </button>
        ),
      )}
    </div>
  );
}

type Projection = NonNullable<Flute['projection']>;

/** One layer of an ink: where its density comes from, and the glass it is seen through. */
function LayerControls({
  pattern,
  index,
  canRemove,
  images,
  imageNames,
  onPickImage,
  commit,
}: {
  pattern: StipplePattern;
  index: number;
  canRemove: boolean;
  images: Record<string, StippleImage>;
  imageNames: Record<string, string>;
  onPickImage: (name: string, file: File | undefined) => void;
  commit: (pattern: StipplePattern) => void;
}) {
  const layer = pattern.layers[index];
  const {source} = layer;
  const flute = fluteOf(layer);
  const projection: Projection = flute?.projection ?? 'orthographic';
  const set = (patch: Record<string, unknown>) => commit(updateSource(pattern, index, patch));
  const setF = (patch: Partial<Flute>) => commit(updateLayer(pattern, index, (l) => setFlute(l, {...flute!, ...patch})));
  const image = source.type === 'image' ? images[source.image] : undefined;

  return (
    <div className="ks-stipple-layer">
      <div className="ks-stipple-row ks-stipple-row-between">
        <Text size="sm" weight="medium">
          Layer {index + 1}
        </Text>
        {canRemove && (
          <Button
            label="Remove layer"
            size="sm"
            variant="secondary"
            onClick={() => commit({...pattern, layers: pattern.layers.filter((_, i) => i !== index)})}
          />
        )}
      </div>
      <Select<SourceKind>
        label="Source"
        value={source.type}
        options={[
          ['radial', 'radial gradient'],
          ['linear', 'linear gradient'],
          ['image', 'image'],
        ]}
        onChange={(kind) => commit(setSourceKind(pattern, index, kind))}
      />
      {source.type === 'radial' && (
        <>
          <Slider label="Radius" value={source.radius} min={0.1} max={4} step={0.05} onChange={(radius) => set({radius})} />
          <Slider label="Falloff" value={source.gamma ?? 1} min={0.2} max={5} step={0.05} onChange={(gamma) => set({gamma})} />
        </>
      )}
      {source.type === 'linear' && (
        <>
          <Slider label="Angle" value={source.angle} min={0} max={360} step={1} onChange={(angle) => set({angle})} />
          <Slider label="From" value={source.from} min={-3} max={3} step={0.05} onChange={(from) => set({from})} />
          <Slider label="To" value={source.to} min={-3} max={3} step={0.05} onChange={(to) => set({to})} />
          <Slider label="Falloff" value={source.gamma ?? 1} min={0.2} max={5} step={0.05} onChange={(gamma) => set({gamma})} />
        </>
      )}
      {source.type === 'image' && (
        <>
          <label className="ks-stipple-field">
            <Text size="sm" color="secondary">
              {imageNames[source.image] ?? (image ? 'placeholder' : 'pick a monochrome image')}
              {image ? ` (${image.width}×${image.height})` : ''}
            </Text>
            <input type="file" accept="image/*" onChange={(event) => onPickImage(source.image, event.target.files?.[0])} />
          </label>
          <Slider label="Height" value={source.height ?? 2} min={0.2} max={6} step={0.05} onChange={(height) => set({height})} />
          <Slider label="Falloff" value={source.gamma ?? 1} min={0.2} max={5} step={0.05} onChange={(gamma) => set({gamma})} />
          <Select
            label="Dense where the image is"
            value={source.invert ? 'light' : 'dark'}
            options={['dark', 'light']}
            onChange={(v) => set({invert: v === 'light'})}
          />
          {image && (
            <Button
              label="Centre and fill the height"
              size="sm"
              variant="secondary"
              onClick={() => set({x: 0, y: 0, height: 2} satisfies Partial<ImageSource>)}
            />
          )}
        </>
      )}
      <Select<'none' | Projection>
        label="Fluted glass"
        value={flute ? projection : 'none'}
        options={[
          ['none', 'none'],
          ['orthographic', 'straight on (sharp edge per rib)'],
          ['perspective', 'lens (stretched slice per rib)'],
        ]}
        onChange={(v) =>
          commit(
            updateLayer(pattern, index, (l) =>
              setFlute(
                l,
                v === 'none' ? undefined : {type: 'flute', angle: 0, period: 0.12, falloff: 2.5, ...flute, projection: v},
              ),
            ),
          )
        }
      />
      {flute && (
        <>
          <Slider label="Rib angle" value={flute.angle} min={0} max={180} step={1} onChange={(angle) => setF({angle})} />
          <Slider label="Rib width" value={flute.period} min={0.02} max={0.5} step={0.005} onChange={(period) => setF({period})} />
          <Slider label="Rib offset" value={flute.phase ?? 0} min={0} max={1} step={0.01} onChange={(phase) => setF({phase})} />
          {projection === 'orthographic' ? (
            <>
              <Slider label="Fade" value={flute.falloff ?? 1} min={0.1} max={6} step={0.1} onChange={(falloff) => setF({falloff})} />
              <Select
                label="Sharp edge"
                value={flute.mirror ? 'trailing' : 'leading'}
                options={['leading', 'trailing']}
                onChange={(v) => setF({mirror: v === 'trailing'})}
              />
            </>
          ) : (
            <>
              <Slider label="Strength" value={flute.scale ?? 1} min={-30} max={30} step={0.25} onChange={(scale) => setF({scale})} />
              <Slider label="Shift" value={flute.shift ?? 0} min={-15} max={15} step={0.25} onChange={(shift) => setF({shift})} />
              <Slider label="Bend" value={flute.bend ?? 0} min={-1} max={2} step={0.05} onChange={(bend) => setF({bend})} />
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Everything about one ink: colour, dots, and its layers. */
function InkCard({
  pattern,
  ink,
  number,
  canRemove,
  onExport,
  ...layerProps
}: {
  pattern: StipplePattern;
  ink: string;
  number: number;
  canRemove: boolean;
  onExport: (ink: string) => void;
  images: Record<string, StippleImage>;
  imageNames: Record<string, string>;
  onPickImage: (name: string, file: File | undefined) => void;
  commit: (pattern: StipplePattern) => void;
}) {
  const {commit} = layerProps;
  const style = resolveInk(pattern, ink);
  const set = (patch: Partial<InkStyle>) => commit(setInk(pattern, ink, patch));
  const layers = pattern.layers.flatMap((layer, index) => (layer.ink === ink ? [index] : []));
  // Shared sampling places every ink on the first ink's points.
  const placesOwnDots = pattern.sampling !== 'shared' || number === 1;
  return (
    <details open className="ks-stipple-ink-card">
      <summary>
        <span className="ks-stipple-dot" style={{background: style.color}} />
        <Text weight="medium">Ink {number}</Text>
      </summary>
      <div className="ks-stipple-row">
        <input
          type="color"
          className="ks-stipple-swatch"
          aria-label={`Colour of ink ${number}`}
          value={parseHex(style.color) ?? '#000000'}
          onChange={(event) => set({color: event.target.value})}
        />
        <HexInput label={`Hex colour of ink ${number}`} value={style.color} onChange={(color) => set({color})} />
        <span className="ks-spacer" />
        <Button label="Export PNG" size="sm" variant="secondary" onClick={() => onExport(ink)} />
        {canRemove && <Button label="Remove ink" size="sm" variant="secondary" onClick={() => commit(removeInk(pattern, ink))} />}
      </div>
      <Group title="Dots">
        <Slider label="Dot radius" value={style.radius} min={0.0005} max={0.015} step={0.0005} onChange={(radius) => set({radius})} />
        <Slider label="Density" value={style.gain} min={0.1} max={4} step={0.05} onChange={(gain) => set({gain})} />
        {placesOwnDots ? (
          <>
            <Slider label="Spacing" value={style.spacing} min={0.002} max={0.03} step={0.0005} onChange={(spacing) => set({spacing})} />
            <Select
              label="Points"
              value={style.points}
              options={['blue-noise', 'grid']}
              onChange={(points) => set({points})}
            />
            {style.points === 'grid' && (
              <Slider label="Jitter" value={style.jitter} min={0} max={1} step={0.05} onChange={(jitter) => set({jitter})} />
            )}
            <Slider label="Seed" value={style.seed} min={1} max={100} step={1} onChange={(seed) => set({seed})} />
          </>
        ) : (
          <Text size="sm" color="secondary">
            With shared sampling, ink 1's spacing, points and seed place every ink's dots.
          </Text>
        )}
        {layers.length > 1 && (
          <Select<Blend>
            label="Combine layers by"
            value={style.blend}
            options={['screen', 'max', 'multiply']}
            onChange={(blend) => set({blend})}
          />
        )}
      </Group>
      <Group title="Layers">
        {layers.map((index) => (
          <LayerControls key={index} pattern={pattern} index={index} canRemove={layers.length > 1} {...layerProps} />
        ))}
        <Button label="Add layer" size="sm" variant="secondary" onClick={() => commit(addLayer(pattern, ink))} />
      </Group>
    </details>
  );
}

/* ---------- Page ---------- */

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

  // Bitmaps live outside the JSON (they would swamp it); image sources name them.
  const [images, setImages] = useState<Record<string, StippleImage>>(placeholderImages);
  const [imageNames, setImageNames] = useState<Record<string, string>>({});
  const usesImages = pattern.layers.some((layer) => layer.source.type === 'image');
  const drawn = useMemo(() => (usesImages ? {...pattern, images} : pattern), [pattern, images, usesImages]);
  const pickImage = async (name: string, file: File | undefined) => {
    if (!file) return;
    const image = await loadImage(file);
    setImages((current) => ({...current, [name]: image}));
    setImageNames((current) => ({...current, [name]: file.name}));
    // The first image picked sets the picture's shape.
    if (!Object.keys(imageNames).length) setAspect(Math.min(2.5, Math.max(0.4, Math.round((image.width / image.height) * 20) / 20)));
  };

  const moveCentre = (index: number, x: number, y: number) =>
    commit(pattern.layers[index].source.type === 'linear' ? pattern : updateSource(pattern, index, {x, y}));

  const [exporting, setExporting] = useState(false);
  /** Runs an export after the "Exporting…" label has painted: rendering 3000 px blocks the page. */
  const run = (work: () => Promise<void> | void) => {
    setExporting(true);
    setTimeout(async () => {
      try {
        await work();
      } finally {
        setExporting(false);
      }
    }, 30);
  };
  const exportPng = () =>
    run(async () => {
      const canvas = document.createElement('canvas');
      canvas.height = EXPORT_HEIGHT;
      canvas.width = Math.round(EXPORT_HEIGHT * aspect);
      drawStipple(canvas, drawn);
      download(await pngOf(canvas), 'stipple.png');
    });
  const exportInk = (ink?: string) => run(() => exportPlates(drawn, aspect, ink));

  const inks = Object.keys(pattern.inks);
  const layerProps = {images, imageNames, onPickImage: (n: string, f: File | undefined) => void pickImage(n, f), commit};

  return (
    <div className="ks-stipple">
      <div className="ks-stipple-column ks-stipple-preview">
        <div className="ks-stipple-row ks-stipple-row-between">
          <Heading level={1} type="display-3">
            Stipple patterns
          </Heading>
          <a href="../" className="ks-stipple-back">
            ← Design kitchen sink
          </a>
        </div>
        <div
          className="ks-stipple-frame"
          style={{
            background: backgrounds[background],
            containerType: 'size',
            aspectRatio: aspect,
            // Fits the window, so the export buttons stay in view.
            width: `min(100%, calc((100vh - 240px) * ${aspect}))`,
          }}
        >
          <StippleCanvas pattern={drawn} className="ks-stipple-canvas" />
          {showHandles && <CentreHandles pattern={pattern} onMove={moveCentre} />}
        </div>
        <div className="ks-stipple-row">
          <Button label={exporting ? 'Exporting…' : 'Export PNG'} isDisabled={exporting} onClick={exportPng} />
          <Button
            label="Export PNG per ink (zip)"
            variant="secondary"
            isDisabled={exporting}
            onClick={() => exportInk()}
          />
          <Button
            label={showHandles ? 'Hide handles' : 'Show handles'}
            variant="secondary"
            onClick={() => setShowHandles(!showHandles)}
          />
          <Button label="Copy JSON" variant="secondary" onClick={() => navigator.clipboard.writeText(source)} />
        </div>
        <Text as="p" display="block" color="secondary">
          Each ink has its own colour, dots and layers. A layer reads its density from a radial or linear gradient or
          a monochrome image (dark or opaque = dense), optionally seen through fluted glass; an ink's layers combine
          before its dots are placed. Later inks paint over earlier ones. Drag the numbered handles to move a layer's
          centre. One pattern unit is half the image height. Exports are 3000 px tall with a transparent background,
          as one PNG, or one PNG per ink (a zip, or from an ink's card) that line up exactly when stacked. Images are
          not part of the JSON.
        </Text>
      </div>
      <div className="ks-stipple-column">
        <Group title="Picture">
          <Select
            label="Start from a preset"
            value={''}
            options={[['', 'choose…'], ...Object.keys(presets).map((name) => [name, name] as const)]}
            onChange={(name) => name && commit(withBrandInks(presets[name], background))}
          />
          <Select
            label="Sampling"
            value={pattern.sampling ?? 'independent'}
            options={[
              ['independent', 'independent (each ink its own dots)'],
              ['shared', 'shared (one dot per point across inks)'],
            ]}
            onChange={(sampling) => commit({...pattern, sampling})}
          />
          <Slider label="Aspect" value={aspect} min={0.4} max={2.5} step={0.05} onChange={setAspect} />
          <div className="ks-stipple-row">
            {(Object.keys(backgrounds) as Background[]).map((name) => (
              <Button
                key={name}
                size="sm"
                label={`${name} background`}
                variant={background === name ? 'primary' : 'secondary'}
                onClick={() => {
                  setBackground(name);
                  // Brand inks follow the background, as on the docs hero; inks you picked stay.
                  if (hasBrandInks(pattern)) commit(withBrandInks(pattern, name));
                }}
              />
            ))}
          </div>
        </Group>
        {inks.map((ink, index) => (
          <InkCard
            key={ink}
            pattern={pattern}
            ink={ink}
            number={index + 1}
            canRemove={inks.length > 1}
            onExport={exportInk}
            {...layerProps}
          />
        ))}
        <Button label="Add ink" variant="secondary" onClick={() => commit(addInk(pattern))} />
        <details className="ks-stipple-json-box">
          <summary>
            <Text weight="medium">JSON</Text>
          </summary>
          <textarea
            className="ks-stipple-json"
            spellCheck={false}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
        </details>
        {error && (
          <Text as="p" display="block" color="secondary">
            {error}
          </Text>
        )}
      </div>
    </div>
  );
}
