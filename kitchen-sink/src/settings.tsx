import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';
import {defineTheme, type DefineThemeInput} from '@astryxdesign/core/theme';
import {jazzThemeInput} from '../../themes/jazz/jazzTheme';

/**
 * Everything the settings overlay can dial. `null` means "as in
 * jazzTheme.ts"; only the fields someone changed end up in the export.
 */
export type Settings = {
  mode: 'light' | 'dark' | 'system';
  accent: string | null;
  neutralStyle: 'neutral' | 'warm' | 'cool' | null;
  contrast: 'standard' | 'high' | null;
  typeBase: number | null;
  typeRatio: number | null;
  radiusBase: number | null;
  radiusMultiplier: number | null;
  bodyFamily: string | null;
  headingFamily: string | null;
  codeFamily: string | null;
  /** Token name → [light, dark] (or a single value). */
  tokens: Record<string, string | [string, string]>;
  /** JSON text merged over the theme's `components`. */
  componentsJson: string;
};

export const initialSettings: Settings = {
  mode: 'system',
  accent: null,
  neutralStyle: null,
  contrast: null,
  typeBase: null,
  typeRatio: null,
  radiusBase: null,
  radiusMultiplier: null,
  bodyFamily: null,
  headingFamily: null,
  codeFamily: null,
  tokens: {},
  componentsJson: '',
};

const STORAGE_KEY = 'jazz-kitchen-sink-settings-v1';

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return {...initialSettings, ...JSON.parse(raw)};
  } catch {
    // Private windows and blocked storage fall back to the defaults.
  }
  return initialSettings;
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

function withoutAccentPins<T extends Record<string, unknown>>(tokens: T): T {
  return Object.fromEntries(Object.entries(tokens).filter(([k]) => !ACCENT_PINS.includes(k))) as T;
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
      // A changed accent re-derives the accent family, so the logo-blue pins
      // step aside unless they were edited directly.
      ...(s.accent ? withoutAccentPins(base.tokens ?? {}) : base.tokens),
      ...s.tokens,
    },
    components: extraComponents ? mergeComponents(base.components ?? {}, extraComponents) : base.components,
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
  if (Object.keys(s.tokens).length) diff.tokens = s.tokens;
  const {value} = parseComponents(s.componentsJson);
  if (value) diff.components = value;
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
