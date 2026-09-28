import {useEffect, useState, type ReactNode} from 'react';
import {jazzThemeInput} from '../../themes/jazz/jazzTheme';
import {GREY_PRESETS, initialSettings, settingsDiff, TYPE_ROLES, useSettings, type Settings} from './settings';

/*
 * The overlay is plain HTML with its own styles (sink.css), so experiments
 * with the theme never make the controls themselves unusable.
 */

const FONT_CHOICES = [
  {label: 'Jazz main', value: 'main_font'},
  {label: 'Jazz body', value: 'body_font'},
  {label: 'Jazz code', value: 'code_font'},
  {label: 'Geist Mono', value: 'Geist Mono'},
  {label: 'System UI', value: 'system-ui'},
  {label: 'Serif', value: 'Georgia'},
];

// jazzTheme.ts's weights per type role (dist/jazz/tokens.css); the homepage's
// display headings pin 900 on top of the display roles.
const DEFAULT_WEIGHTS: Record<string, string> = {
  'display-1': '400',
  'display-2': '400',
  'display-3': '400',
  'heading-1': '700',
  'heading-2': '700',
  'heading-3': '700',
  'heading-4': '700',
  large: '600',
  body: '400',
  label: '500',
  supporting: '400',
  code: '400',
};
const WEIGHT_CHOICES = ['300', '400', '500', '600', '700', '800', '900'];

function WeightRow({role}: {role: string}) {
  const {settings, setSettings} = useSettings();
  const value = settings.weights[role];
  const set = (next: string | null) =>
    setSettings((s) => {
      const weights = {...s.weights};
      if (next == null) delete weights[role];
      else weights[role] = next;
      return {...s, weights};
    });
  return (
    <Row label={role}>
      <select value={value ?? DEFAULT_WEIGHTS[role]} onChange={(e) => set(e.target.value)}>
        {WEIGHT_CHOICES.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>
      <ResetButton isVisible={value != null} onClick={() => set(null)} />
    </Row>
  );
}

const baseTokens = jazzThemeInput.tokens as Record<string, string | readonly [string, string]>;

function Row({label, hint, children}: {label: string; hint?: string; children: ReactNode}) {
  return (
    <label className="ks-row">
      <span className="ks-row-label">
        {label}
        {hint ? <span className="ks-hint">{hint}</span> : null}
      </span>
      <span className="ks-row-control">{children}</span>
    </label>
  );
}

function NumberKnob({
  value,
  fallback,
  min,
  max,
  step,
  onChange,
}: {
  value: number | null;
  fallback: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number | null) => void;
}) {
  const current = value ?? fallback;
  return (
    <>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        className="ks-number"
        type="number"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
      <ResetButton isVisible={value != null} onClick={() => onChange(null)} />
    </>
  );
}

function ResetButton({isVisible, onClick}: {isVisible: boolean; onClick: () => void}) {
  return (
    <button type="button" className="ks-reset" onClick={onClick} disabled={!isVisible} title="Back to jazzTheme.ts">
      ↺
    </button>
  );
}

function isHex6(v: string) {
  return /^#[0-9a-f]{6}$/i.test(v);
}

/** A colour as text (any CSS colour, alpha allowed) with a picker for #RRGGBB. */
function ColorField({value, onChange}: {value: string; onChange: (v: string) => void}) {
  return (
    <span className="ks-color">
      <span className="ks-swatch" style={{background: value}}>
        <input
          type="color"
          value={isHex6(value.slice(0, 7)) ? value.slice(0, 7) : '#000000'}
          onChange={(e) => onChange(e.target.value.toUpperCase() + (value.length === 9 ? value.slice(7) : ''))}
          aria-label="Pick colour"
        />
      </span>
      <input className="ks-text" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
    </span>
  );
}

function TokenRow({name}: {name: string}) {
  const {settings, setSettings} = useSettings();
  const base = baseTokens[name];
  const current = settings.tokens[name] ?? base;
  const pair: [string, string] = Array.isArray(current) ? [current[0], current[1]] : [current as string, current as string];
  const isPair = Array.isArray(base);
  const set = (next: string | [string, string] | null) =>
    setSettings((s) => {
      const tokens = {...s.tokens};
      if (next == null) delete tokens[name];
      else tokens[name] = next;
      return {...s, tokens};
    });
  return (
    <div className="ks-token">
      <div className="ks-token-name">
        <code>{name.replace('--color-', '')}</code>
        <ResetButton isVisible={name in settings.tokens} onClick={() => set(null)} />
      </div>
      {isPair ? (
        <div className="ks-token-pair">
          <ColorField value={pair[0]} onChange={(v) => set([v, pair[1]])} />
          <ColorField value={pair[1]} onChange={(v) => set([pair[0], v])} />
        </div>
      ) : (
        <input className="ks-text" value={String(current)} onChange={(e) => set(e.target.value)} />
      )}
    </div>
  );
}

function Section({title, children, defaultOpen = true}: {title: string; children: ReactNode; defaultOpen?: boolean}) {
  return (
    <details className="ks-section" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="ks-section-body">{children}</div>
    </details>
  );
}

export function SettingsOverlay() {
  const {settings, setSettings, componentsError} = useSettings();
  const [isOpen, setOpen] = useState(true);
  // On wide screens the open overlay takes its own column instead of covering the page.
  useEffect(() => {
    document.documentElement.classList.toggle('ks-overlay-open', isOpen);
  }, [isOpen]);
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((s) => ({...s, [key]: value}));
  const typography = jazzThemeInput.typography;
  const diff = settingsDiff(settings);
  const changed = Object.keys(diff).length;

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(diff, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isOpen) {
    return (
      <button type="button" className="ks-fab" onClick={() => setOpen(true)}>
        Theme settings{changed ? ` · ${changed} changed` : ''}
      </button>
    );
  }

  return (
    <aside className="ks-overlay" aria-label="Theme settings">
      <header className="ks-overlay-header">
        <strong>Theme settings</strong>
        <span className="ks-spacer" />
        <button type="button" onClick={() => setOpen(false)} aria-label="Close settings">
          ✕
        </button>
      </header>

      <div className="ks-overlay-body">
        <Section title="Mode">
          <div className="ks-segmented" role="radiogroup" aria-label="Colour mode">
            {(['light', 'dark', 'system'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={settings.mode === m}
                className={settings.mode === m ? 'is-on' : ''}
                onClick={() => set('mode', m)}
              >
                {m}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Colour">
          <Row label="Accent" hint="re-derives the accent family">
            <ColorField value={settings.accent ?? jazzThemeInput.color.accent} onChange={(v) => set('accent', v)} />
            <ResetButton isVisible={settings.accent != null} onClick={() => set('accent', null)} />
          </Row>
          <Row label="Grey family" hint="the site's pinned greys, or a Tailwind family in the same roles">
            <select
              value={settings.greyPreset ?? 'site'}
              onChange={(e) => set('greyPreset', e.target.value === 'site' ? null : (e.target.value as Settings['greyPreset']))}
            >
              <option value="site">site (Fumadocs neutral)</option>
              {GREY_PRESETS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <ResetButton isVisible={settings.greyPreset != null} onClick={() => set('greyPreset', null)} />
          </Row>
          <Row label="Generated greys" hint="Astryx's own greys, tinted by the accent; replaces the pinned greys">
            <select
              value={settings.neutralStyle ?? jazzThemeInput.color.neutralStyle}
              onChange={(e) => set('neutralStyle', e.target.value as Settings['neutralStyle'])}
            >
              <option value="neutral">off (use pinned greys)</option>
              <option value="cool">cool: light accent tint</option>
              <option value="warm">warm: stronger accent tint</option>
            </select>
            <ResetButton isVisible={settings.neutralStyle != null} onClick={() => set('neutralStyle', null)} />
          </Row>
          <Row label="Contrast">
            <select
              value={settings.contrast ?? jazzThemeInput.color.contrast}
              onChange={(e) => set('contrast', e.target.value as Settings['contrast'])}
            >
              <option value="standard">standard</option>
              <option value="high">high</option>
            </select>
            <ResetButton isVisible={settings.contrast != null} onClick={() => set('contrast', null)} />
          </Row>
        </Section>

        <Section title="Type">
          <Row label="Base size" hint="px">
            <NumberKnob
              value={settings.typeBase}
              fallback={typography.scale.base}
              min={12}
              max={20}
              step={0.5}
              onChange={(v) => set('typeBase', v)}
            />
          </Row>
          <Row label="Scale ratio" hint="body text is the base, so it stays put">
            <NumberKnob
              value={settings.typeRatio}
              fallback={typography.scale.ratio}
              min={1.05}
              max={1.5}
              step={0.005}
              onChange={(v) => set('typeRatio', v)}
            />
          </Row>
          {(
            [
              ['Body face', 'bodyFamily', typography.body.family],
              ['Heading face', 'headingFamily', typography.heading.family],
              ['Code face', 'codeFamily', typography.code.family],
            ] as const
          ).map(([label, key, fallback]) => (
            <Row key={key} label={label}>
              <select value={settings[key] ?? fallback} onChange={(e) => set(key, e.target.value)}>
                {FONT_CHOICES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ResetButton isVisible={settings[key] != null} onClick={() => set(key, null)} />
            </Row>
          ))}
        </Section>

        <Section title="Weights" defaultOpen={false}>
          {TYPE_ROLES.map((role) => (
            <WeightRow key={role} role={role} />
          ))}
        </Section>

        <Section title="Shape">
          <Row label="Radius base" hint="px; at ×1.5 controls get 3× and cards 4.5×">
            <NumberKnob
              value={settings.radiusBase}
              fallback={jazzThemeInput.radius.base}
              min={0}
              max={8}
              step={0.5}
              onChange={(v) => set('radiusBase', v)}
            />
          </Row>
          <Row label="Radius multiplier">
            <NumberKnob
              value={settings.radiusMultiplier}
              fallback={jazzThemeInput.radius.multiplier}
              min={1}
              max={2.5}
              step={0.05}
              onChange={(v) => set('radiusMultiplier', v)}
            />
          </Row>
        </Section>

        <Section title="Pinned colours (light · dark)" defaultOpen={false}>
          {Object.keys(baseTokens)
            .filter((k) => k.startsWith('--color-'))
            .map((name) => (
              <TokenRow key={name} name={name} />
            ))}
        </Section>

        <Section title="Component overrides (JSON)" defaultOpen={false}>
          <p className="ks-help">
            Merged over the theme's <code>components</code>, e.g.{' '}
            <code>{'{"side-nav-item": {"base": {"minHeight": "36px"}}}'}</code>
          </p>
          <textarea
            className="ks-json"
            rows={8}
            spellCheck={false}
            value={settings.componentsJson}
            onChange={(e) => set('componentsJson', e.target.value)}
            placeholder={JSON.stringify({'top-nav': {base: {paddingBlock: '14px'}}}, null, 2)}
          />
          {componentsError ? <p className="ks-error">{componentsError}</p> : null}
        </Section>
      </div>

      <footer className="ks-overlay-footer">
        <span>{changed ? `${changed} group${changed === 1 ? '' : 's'} changed` : 'Matches jazzTheme.ts'}</span>
        <span className="ks-spacer" />
        <button type="button" onClick={() => setSettings((s) => ({...initialSettings, mode: s.mode}))} disabled={!changed}>
          Reset all
        </button>
        <button type="button" className="ks-primary" onClick={copy} disabled={!changed}>
          {copied ? 'Copied' : 'Copy changes'}
        </button>
      </footer>
    </aside>
  );
}
