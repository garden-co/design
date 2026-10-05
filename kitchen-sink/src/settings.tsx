import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';
import {defineTheme, expandTypeScale, type DefineThemeInput} from '@astryxdesign/core/theme';
import {jazzThemeInput} from '../../themes/jazz/jazzTheme';

/**
 * Everything the settings overlay can dial. `null` means "as in
 * jazzTheme.ts"; only the fields someone changed end up in the export.
 */
export type Settings = {
  mode: 'light' | 'dark' | 'system';
  accent: string | null;
  neutralStyle: 'neutral' | 'warm' | 'cool' | null;
  /** Replaces the site's pinned greys with a Tailwind grey family. */
  greyPreset: GreyPreset | null;
  contrast: 'standard' | 'high' | null;
  typeBase: number | null;
  typeRatio: number | null;
  radiusBase: number | null;
  radiusMultiplier: number | null;
  bodyFamily: string | null;
  headingFamily: string | null;
  codeFamily: string | null;
  /** Type role (`heading-1`, `body`, `display-2`, …) → CSS font-weight. */
  weights: Record<string, string>;
  /** Token name → [light, dark] (or a single value). */
  tokens: Record<string, string | [string, string]>;
  /** JSON text merged over the theme's `components`. */
  componentsJson: string;
};

export const initialSettings: Settings = {
  mode: 'system',
  accent: null,
  neutralStyle: null,
  greyPreset: null,
  contrast: null,
  typeBase: null,
  typeRatio: null,
  radiusBase: null,
  radiusMultiplier: null,
  bodyFamily: null,
  headingFamily: null,
  codeFamily: null,
  weights: {},
  tokens: {},
  componentsJson: '',
};

const STORAGE_KEY = 'jazz-kitchen-sink-settings-v1';

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitize(JSON.parse(raw));
  } catch {
    // Private windows and blocked storage fall back to the defaults.
  }
  return initialSettings;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const oneOf = <T,>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback;
const stringOrNull = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null);
const numberOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Settings saved by an older version of this page can hold values it no
 * longer offers (a removed grey family, say). Each field keeps a stored
 * value only if it is still valid, so a stale save can't break the page.
 */
function sanitize(stored: unknown): Settings {
  if (!isRecord(stored)) return initialSettings;
  return {
    mode: oneOf(stored.mode, ['light', 'dark', 'system'] as const, initialSettings.mode),
    accent: stringOrNull(stored.accent),
    neutralStyle: oneOf(stored.neutralStyle, ['neutral', 'warm', 'cool', null] as const, null),
    greyPreset: oneOf(stored.greyPreset, [...GREY_PRESETS, null], null),
    contrast: oneOf(stored.contrast, ['standard', 'high', null] as const, null),
    typeBase: numberOrNull(stored.typeBase),
    typeRatio: numberOrNull(stored.typeRatio),
    radiusBase: numberOrNull(stored.radiusBase),
    radiusMultiplier: numberOrNull(stored.radiusMultiplier),
    bodyFamily: stringOrNull(stored.bodyFamily),
    headingFamily: stringOrNull(stored.headingFamily),
    codeFamily: stringOrNull(stored.codeFamily),
    weights: isRecord(stored.weights)
      ? (Object.fromEntries(Object.entries(stored.weights).filter(([, w]) => typeof w === 'string')) as Record<string, string>)
      : {},
    tokens: isRecord(stored.tokens)
      ? (Object.fromEntries(
          Object.entries(stored.tokens).filter(
            ([, v]) => typeof v === 'string' || (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'string')),
          ),
        ) as Settings['tokens'])
      : {},
    componentsJson: typeof stored.componentsJson === 'string' ? stored.componentsJson : '',
  };
}

type ComponentOverrides = NonNullable<DefineThemeInput['components']>;

function parseComponents(json: string): {value: ComponentOverrides | null; error: string | null} {
  if (json.trim() === '') return {value: null, error: null};
  try {
    const value = JSON.parse(json);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {value: null, error: 'Expected an object of component overrides'};
    }
    return {value, error: null};
  } catch (e) {
    return {value: null, error: (e as Error).message};
  }
}

/** Merges per-component overrides one level deep (component → variant key). */
function mergeComponents(base: ComponentOverrides, extra: ComponentOverrides): ComponentOverrides {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [name, variants] of Object.entries(base)) out[name] = {...(variants as object)};
  for (const [name, variants] of Object.entries(extra)) {
    const target = (out[name] ??= {});
    for (const [key, style] of Object.entries(variants as Record<string, unknown>)) {
      const prev = target[key];
      target[key] =
        prev && typeof prev === 'object' && style && typeof style === 'object'
          ? {...(prev as object), ...(style as object)}
          : style;
    }
  }
  return out as ComponentOverrides;
}

const ACCENT_PINS = ['--color-accent', '--color-text-accent', '--color-icon-accent'];

// The theme pins the site's Fumadocs greys; they step aside when another
// grey style is picked so the generated greys show.
const GREY_PINS = [
  '--color-background-body',
  '--color-background-surface',
  '--color-background-card',
  '--color-background-popover',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-border',
];

// Tailwind grey families: 100, 300, 400, 600, 900, 950, 200.
const GREY_FAMILIES = {
  neutral: ['#F5F5F5', '#D4D4D4', '#A3A3A3', '#525252', '#171717', '#0A0A0A', '#E5E5E5'],
  zinc: ['#F4F4F5', '#D4D4D8', '#A1A1AA', '#52525B', '#18181B', '#09090B', '#E4E4E7'],
  slate: ['#F1F5F9', '#CBD5E1', '#94A3B8', '#475569', '#0F172A', '#020617', '#E2E8F0'],
} as const;
export type GreyPreset = keyof typeof GREY_FAMILIES;
export const GREY_PRESETS = Object.keys(GREY_FAMILIES) as GreyPreset[];

/** The site's grey pins, rebuilt from a Tailwind family in the same roles. */
function greyPresetTokens(preset: GreyPreset | null): Record<string, [string, string]> {
  if (!preset) return {};
  const [c100, c300, c400, c600, c900, c950, c200] = GREY_FAMILIES[preset];
  return {
    '--color-background-body': [c100, c950],
    '--color-background-surface': ['#FFFFFF', c950],
    '--color-background-card': ['#FFFFFF', c900],
    '--color-background-popover': ['#FFFFFF', c950],
    '--color-text-primary': [c950, c200],
    '--color-text-secondary': [c600, c400],
    '--color-border': [`${c300}80`, '#FFFFFF1F'],
  };
}

function withoutPins<T extends Record<string, unknown>>(tokens: T, pins: string[]): T {
  return Object.fromEntries(Object.entries(tokens).filter(([k]) => !pins.includes(k))) as T;
}

/** Type roles the overlay offers weights for, with the scale step each size follows. */
export const TYPE_ROLES = [
  'display-1',
  'display-2',
  'display-3',
  'heading-1',
  'heading-2',
  'heading-3',
  'heading-4',
  'large',
  'body',
  'label',
  'supporting',
  'code',
] as const;

function remOf(tokens: Record<string, string>, name: string): number {
  let v = tokens[name];
  for (let i = 0; i < 4 && v?.startsWith('var('); i++) v = tokens[v.slice(4, -1)];
  return v ? parseFloat(v) : 1;
}

/**
 * The theme pins the document heading sizes in rem. So the scale sliders
 * move them too, each pin is scaled by how much its scale step moved from
 * jazzTheme.ts's scale. The homepage's display headings keep their own
 * viewport-based sizes.
 */
function scaledPins(
  components: NonNullable<DefineThemeInput['components']>,
  from: {base: number; ratio: number},
  to: {base: number; ratio: number},
) {
  if (from.base === to.base && from.ratio === to.ratio) return components;
  const a = expandTypeScale(from);
  const b = expandTypeScale(to);
  const factor = (token: string) => remOf(b, token) / remOf(a, token);
  const scale = (style: Record<string, unknown> | undefined, token: string) => {
    if (!style) return style;
    const k = factor(token).toFixed(4);
    const out = {...style};
    for (const prop of ['fontSize', 'lineHeight']) {
      const v = out[prop];
      if (typeof v === 'string' && /rem|px|vw|clamp/.test(v)) out[prop] = `calc(${v} * ${k})`;
    }
    return out;
  };
  const heading = {...(components.heading as Record<string, Record<string, unknown>>)};
  for (const n of [1, 2, 3]) heading[`level:${n}`] = scale(heading[`level:${n}`], `--text-heading-${n}-size`)!;
  return {...components, heading} as typeof components;
}

/** Weight pins in components (the homepage display lines) follow the overlay too. */
function withWeights(components: NonNullable<DefineThemeInput['components']>, weights: Record<string, string>) {
  const heading = {...(components.heading as Record<string, Record<string, unknown>>)};
  for (const n of [1, 2, 3]) {
    const w = weights[`display-${n}`];
    if (w && heading[`type:display-${n}`]) heading[`type:display-${n}`] = {...heading[`type:display-${n}`], fontWeight: w};
  }
  return {...components, heading} as typeof components;
}

/** The theme input with the overlay's changes applied. */
export function applySettings(s: Settings): {input: DefineThemeInput; componentsError: string | null} {
  const base = jazzThemeInput as DefineThemeInput;
  const {value: extraComponents, error} = parseComponents(s.componentsJson);
  const typography = base.typography!;
  const input: DefineThemeInput = {
    ...base,
    color: {
      ...base.color,
      ...(s.accent ? {accent: s.accent} : {}),
      ...(s.neutralStyle ? {neutralStyle: s.neutralStyle} : {}),
      ...(s.contrast ? {contrast: s.contrast} : {}),
    },
    typography: {
      ...typography,
      scale: {
        ...typography.scale!,
        ...(s.typeBase != null ? {base: s.typeBase} : {}),
        ...(s.typeRatio != null ? {ratio: s.typeRatio} : {}),
      },
      body: {...typography.body!, ...(s.bodyFamily ? {family: s.bodyFamily} : {})},
      heading: {...typography.heading!, ...(s.headingFamily ? {family: s.headingFamily} : {})},
      code: {...typography.code!, ...(s.codeFamily ? {family: s.codeFamily} : {})},
    },
    radius: {
      ...base.radius!,
      ...(s.radiusBase != null ? {base: s.radiusBase} : {}),
      ...(s.radiusMultiplier != null ? {multiplier: s.radiusMultiplier} : {}),
    },
    tokens: {
      // A changed accent re-derives the accent family, and a changed grey
      // style the greys, so those pins step aside unless edited directly.
      ...withoutPins(base.tokens ?? {}, [
        ...(s.accent ? ACCENT_PINS : []),
        ...(s.neutralStyle && s.neutralStyle !== base.color?.neutralStyle ? GREY_PINS : []),
      ]),
      ...greyPresetTokens(s.greyPreset),
      ...Object.fromEntries(Object.entries(s.weights).map(([role, w]) => [`--text-${role}-weight`, w])),
      ...s.tokens,
    },
    components: (() => {
      let components = withWeights(
        scaledPins(base.components ?? {}, typography.scale!, {
          base: s.typeBase ?? typography.scale!.base,
          ratio: s.typeRatio ?? typography.scale!.ratio,
        }),
        s.weights,
      );
      if (extraComponents) components = mergeComponents(components, extraComponents);
      return components;
    })(),
  };
  return {input, componentsError: error};
}

/** Only what differs from jazzTheme.ts, in its own shape, for pasting back. */
export function settingsDiff(s: Settings): Record<string, unknown> {
  const diff: Record<string, unknown> = {};
  const color = {
    ...(s.accent ? {accent: s.accent} : {}),
    ...(s.neutralStyle ? {neutralStyle: s.neutralStyle} : {}),
    ...(s.contrast ? {contrast: s.contrast} : {}),
  };
  if (Object.keys(color).length) diff.color = color;
  const scale = {
    ...(s.typeBase != null ? {base: s.typeBase} : {}),
    ...(s.typeRatio != null ? {ratio: s.typeRatio} : {}),
  };
  const typography = {
    ...(Object.keys(scale).length ? {scale} : {}),
    ...(s.bodyFamily ? {body: {family: s.bodyFamily}} : {}),
    ...(s.headingFamily ? {heading: {family: s.headingFamily}} : {}),
    ...(s.codeFamily ? {code: {family: s.codeFamily}} : {}),
  };
  if (Object.keys(typography).length) diff.typography = typography;
  const radius = {
    ...(s.radiusBase != null ? {base: s.radiusBase} : {}),
    ...(s.radiusMultiplier != null ? {multiplier: s.radiusMultiplier} : {}),
  };
  if (Object.keys(radius).length) diff.radius = radius;
  const tokens = {
    ...greyPresetTokens(s.greyPreset),
    ...Object.fromEntries(Object.entries(s.weights).map(([role, w]) => [`--text-${role}-weight`, w])),
    ...s.tokens,
  };
  if (Object.keys(tokens).length) diff.tokens = tokens;
  // Every component variant that ends up different: JSON overrides, plus
  // pinned sizes and weights the scale and weight controls moved.
  const before = (jazzThemeInput as DefineThemeInput).components ?? {};
  const after = applySettings(s).input.components ?? {};
  const components: Record<string, Record<string, unknown>> = {};
  for (const [name, variants] of Object.entries(after as Record<string, Record<string, unknown>>)) {
    for (const [key, style] of Object.entries(variants)) {
      const prev = (before as Record<string, Record<string, unknown>>)[name]?.[key];
      if (JSON.stringify(prev) !== JSON.stringify(style)) (components[name] ??= {})[key] = style;
    }
  }
  if (Object.keys(components).length) diff.components = components;
  return diff;
}

type SettingsContextValue = {
  settings: Settings;
  setSettings: (update: (s: Settings) => Settings) => void;
  theme: ReturnType<typeof defineTheme>;
  componentsError: string | null;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({children}: {children: ReactNode}) {
  const [settings, setSettingsState] = useState<Settings>(load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Not persisting is fine.
    }
  }, [settings]);
  const {theme, componentsError} = useMemo(() => {
    const {input, componentsError} = applySettings(settings);
    try {
      return {theme: defineTheme(input), componentsError};
    } catch (e) {
      return {theme: defineTheme(jazzThemeInput as DefineThemeInput), componentsError: (e as Error).message};
    }
  }, [settings]);
  const value = useMemo(
    () => ({settings, setSettings: setSettingsState, theme, componentsError}),
    [settings, theme, componentsError],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings outside SettingsProvider');
  return ctx;
}
