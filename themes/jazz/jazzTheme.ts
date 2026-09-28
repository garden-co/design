import {defineTheme} from '@astryxdesign/core/theme';

/**
 * Jazz theme, extracted from the jazz.tools homepage
 * (garden-co/jazz: docs/app/(home)/page.tsx and docs/app/global.css).
 *
 * Load `@garden-co/design/jazz/fonts.css` alongside the theme CSS so the
 * named families below resolve to the shipped font files.
 */

// Jazz logo mark blue (garden-co/jazz: docs/components/brand/jazz-logo.tsx).
// As a fill it carries a white label at 4.63:1. As text it is only 4.25:1 on
// the #F5F5F5 page and 4.28:1 on near-black, so accent-coloured text and icons
// use one step darker in light mode (4.73:1 on #F5F5F5) and one step lighter
// in dark mode (5.3:1 on #121212).
const LOGO_BLUE = '#146AFF';
const LOGO_BLUE_TEXT_ON_LIGHT = '#1263F0';
const LOGO_BLUE_ON_DARK = '#3D84FF';

export const jazzTheme = defineTheme({
  name: 'jazz',

  // Greys stay neutral to match the homepage's Fumadocs neutral palette.
  color: {accent: LOGO_BLUE, neutralStyle: 'neutral', contrast: 'standard'},

  typography: {
    // 16px body; 1.125 keeps the small steps near the site's Tailwind sizes
    // (sm ≈ 14px, lg = 18px, xl ≈ 20px).
    scale: {base: 16, ratio: 1.125},
    body: {
      family: 'body_font',
      fallbacks: 'ui-sans-serif, system-ui, sans-serif',
    },
    heading: {
      family: 'main_font',
      fallbacks: 'ui-sans-serif, system-ui, sans-serif',
      weight: 'bold',
      weights: {1: 'bold', 2: 'bold', 3: 'bold'},
    },
    code: {
      family: 'code_font',
      fallbacks: '"Geist Mono", ui-monospace, monospace',
    },
  },

  // Homepage cards are rounded-2xl (16px); a 4px base at 1.5x reaches that
  // at container level.
  radius: {base: 4, multiplier: 1.5},

  motion: {fast: 150, medium: 300, slow: 700, ratio: 0.75},

  tokens: {
    // The generator re-tones the seed; pin the logo blue exactly.
    '--color-accent': [LOGO_BLUE, LOGO_BLUE],
    '--color-on-accent': ['#FFFFFF', '#FFFFFF'],
    '--color-text-accent': [LOGO_BLUE_TEXT_ON_LIGHT, LOGO_BLUE_ON_DARK],
    '--color-icon-accent': [LOGO_BLUE_TEXT_ON_LIGHT, LOGO_BLUE_ON_DARK],
    // The live site's page, text and border colours (Fumadocs neutral), so
    // Astryx regions sit seamlessly inside jazz.tools and its docs. Cards and
    // popovers are plain white / near-black, like the homepage's aside.
    '--color-background-body': ['#F5F5F5', '#121212'],
    '--color-background-surface': ['#FFFFFF', '#0A0A0A'],
    '--color-background-card': ['#FFFFFF', '#000000'],
    '--color-background-popover': ['#FFFFFF', '#0A0A0A'],
    '--color-text-primary': ['#0A0A0A', '#EBEBEB'],
    // #737373 (the site's muted grey) is 4.35:1 on #F5F5F5; #6B6B6B passes AA.
    // #939393 is the site's dark muted grey (70% at 0.8 alpha) flattened.
    '--color-text-secondary': ['#6B6B6B', '#939393'],
    '--color-border': ['#CCCCCC80', '#66666633'],
    '--focus-outline-color': 'var(--color-accent)',
  },

  components: {
    // "the database that syncs": heaviest weight, very tight leading and
    // tracking, balanced wrapping.
    heading: {
      base: {letterSpacing: '-0.04em', lineHeight: '0.9', textWrap: 'balance'},
      // Level rules set their own line-height, so repeat the tight leading.
      'level:2': {
        fontSize: 'clamp(1.875rem, 4vw, 2.6rem)',
        fontWeight: '900',
        lineHeight: '0.9',
      },
      'type:display-1': {
        fontSize: 'clamp(4rem, 11vw, 10rem)',
        lineHeight: '0.84',
        letterSpacing: '-0.05em',
        fontWeight: '900',
      },
      // "npm create jazz" footer line.
      'type:display-2': {
        fontSize: 'clamp(2.75rem, 5vw, 6rem)',
        fontWeight: '900',
        lineHeight: '0.9',
        letterSpacing: '-0.06em',
      },
      // Big figures such as pricing meters.
      'type:display-3': {
        fontSize: '2.25rem',
        fontWeight: '900',
        lineHeight: '2.5rem',
        letterSpacing: '-0.06em',
      },
    },
    // Homepage cards: rounded-2xl, p-4.
    card: {
      base: {borderRadius: '1rem', padding: '1rem'},
    },
    // Small uppercase section labels ("JAZZ CLOUD", pricing meter names).
    text: {
      // Colour comes from the component's `color` prop (the Eyebrow helper
      // passes "secondary"); a colour here would lose to data-color rules.
      'type:eyebrow': {
        fontFamily: 'var(--font-family-heading)',
        fontSize: '0.75rem',
        lineHeight: '1rem',
        fontWeight: 'var(--font-weight-semibold)',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      },
    },
    // Inline links stay underlined so they never rely on colour alone
    // (WCAG 1.4.1), matching the homepage's muted underline.
    link: {
      base: {
        textDecorationLine: 'underline',
        textDecorationColor: 'color-mix(in srgb, var(--color-text-secondary) 60%, transparent)',
        textUnderlineOffset: '4px',
      },
    },
  },
});
