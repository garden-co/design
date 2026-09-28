import {defineTheme} from '@astryxdesign/core/theme';

/**
 * Jazz theme, extracted from the jazz.tools homepage
 * (garden-co/jazz: docs/app/(home)/page.tsx and docs/app/global.css).
 *
 * Load `@garden-co/design/jazz/fonts.css` alongside the theme CSS so the
 * named families below resolve to the shipped font files.
 */

// Jazz logo mark blue (garden-co/jazz: docs/components/brand/jazz-logo.tsx).
// #146AFF is 4.63:1 against white, so it carries a white label and works as
// light-mode text. On near-black it falls to 4.28:1, so accent-coloured text
// and icons use a lighter step in dark mode (5.6:1 on #0A0A0A).
const LOGO_BLUE = '#146AFF';
const LOGO_BLUE_ON_DARK = '#3D84FF';

export const jazzTheme = defineTheme({
  name: 'jazz',

  // Greys stay neutral to match the homepage's Fumadocs neutral palette.
  color: {accent: LOGO_BLUE, neutralStyle: 'neutral', contrast: 'standard'},

  typography: {
    // Homepage body copy is 16px under a dramatic heading scale.
    scale: {base: 16, ratio: 1.25},
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
    '--color-text-accent': [LOGO_BLUE, LOGO_BLUE_ON_DARK],
    '--color-icon-accent': [LOGO_BLUE, LOGO_BLUE_ON_DARK],
    // Homepage surfaces are plain white / black with neutral text.
    '--color-background-body': ['#FFFFFF', '#000000'],
    '--color-background-surface': ['#FFFFFF', '#0A0A0A'],
    '--color-text-primary': ['#0A0A0A', '#FAFAFA'],
    '--color-text-secondary': ['#737373', '#A3A3A3'],
    '--focus-outline-color': 'var(--color-accent)',
  },

  components: {
    // "the database that syncs": heaviest weight, very tight leading and
    // tracking, balanced wrapping.
    heading: {
      base: {letterSpacing: '-0.04em', lineHeight: '0.9', textWrap: 'balance'},
      'level:2': {fontSize: 'clamp(1.875rem, 4vw, 2.6rem)', fontWeight: '900'},
      'type:display-1': {
        fontSize: 'clamp(4rem, 11vw, 10rem)',
        lineHeight: '0.84',
        letterSpacing: '-0.05em',
        fontWeight: '900',
      },
      'type:display-2': {
        fontSize: 'clamp(3rem, 7vw, 5.5rem)',
        fontWeight: '900',
      },
    },
    card: {
      base: {borderRadius: 'var(--radius-container)'},
    },
  },
});
