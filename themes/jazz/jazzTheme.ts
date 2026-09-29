import {defineTheme, type DefineThemeInput} from '@astryxdesign/core/theme';

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

/**
 * The raw theme input, exported so tools such as the kitchen sink's settings
 * overlay can derive live variants from it.
 */
export const jazzThemeInput = {
  name: 'jazz',

  // Greys are pinned below (Tailwind stone); the generated neutrals only
  // fill the tokens that aren't pinned.
  color: {accent: LOGO_BLUE, neutralStyle: 'neutral', contrast: 'standard'},

  typography: {
    // 16px body with a pronounced 1.275 ratio (sm = 13px, lg = 20px,
    // xl = 26px), picked in the kitchen sink (Anselm, 2026-09-28).
    scale: {base: 16, ratio: 1.275},
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

  // Half of Astryx's default rounding (Anselm, 2026-09-28).
  radius: {base: 2, multiplier: 1.5},

  motion: {fast: 150, medium: 300, slow: 700, ratio: 0.75},

  tokens: {
    // The generator re-tones the seed; pin the logo blue exactly.
    '--color-accent': [LOGO_BLUE, LOGO_BLUE],
    '--color-on-accent': ['#FFFFFF', '#FFFFFF'],
    '--color-text-accent': [LOGO_BLUE_TEXT_ON_LIGHT, LOGO_BLUE_ON_DARK],
    '--color-icon-accent': [LOGO_BLUE_TEXT_ON_LIGHT, LOGO_BLUE_ON_DARK],
    // Page, text and border colours from Tailwind's stone greys, in the
    // roles the site's Fumadocs greys had (Anselm, 2026-09-28). Cards and
    // popovers are plain white in light mode.
    '--color-background-body': ['#F5F5F4', '#0C0A09'],
    '--color-background-surface': ['#FFFFFF', '#0C0A09'],
    // Dark cards sit one step above the surface (not below it), so a card
    // reads as a raised object rather than a hole in the page.
    '--color-background-card': ['#FFFFFF', '#1C1917'],
    '--color-background-popover': ['#FFFFFF', '#0C0A09'],
    '--color-text-primary': ['#0C0A09', '#E7E5E4'],
    // stone-600 / stone-400: 7.1:1 on #F5F5F4 and 7.9:1 on #0C0A09.
    '--color-text-secondary': ['#57534E', '#A8A29E'],
    // Dark borders at 12% white stay visible on both #0C0A09 and #1C1917.
    '--color-border': ['#D6D3D180', '#FFFFFF1F'],
    // Display types are the heaviest weight everywhere, not only in the
    // homepage headings that pin it.
    '--text-display-1-weight': '900',
    '--text-display-2-weight': '900',
    '--text-display-3-weight': '900',
    '--focus-outline-color': 'var(--color-accent)',
  },

  components: {
    heading: {
      // Document headings (docs, dashboard) keep Astryx's level sizes with
      // the brand face and slightly tight tracking. The homepage's oversized
      // section headings set their size, weight and leading at the call site.
      base: {letterSpacing: '-0.02em', textWrap: 'balance'},
      // Document scale (docs page titles and sections): about 52 / 31 /
      // 22px, dialled in the kitchen sink (Anselm, 2026-09-28).
      'level:1': {fontSize: '3.2283rem', lineHeight: '3.587rem'},
      'level:2': {fontSize: '1.95rem', lineHeight: '2.6rem'},
      'level:3': {fontSize: '1.3889rem', lineHeight: '1.9444rem'},
      // "the database that syncs": heaviest weight, very tight leading and
      // tracking.
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
      // Homepage section headings and big figures such as pricing meters.
      // Slightly looser than display-1/2, which run larger (Anselm,
      // 2026-09-29).
      'type:display-3': {
        fontSize: '2.25rem',
        fontWeight: '900',
        lineHeight: '2.5rem',
        letterSpacing: '-0.04em',
      },
    },
    // Homepage cards: rounded-2xl, p-4.
    card: {
      base: {borderRadius: '1rem', padding: '1rem'},
    },
    // Clickable cards (docs cards, prev/next) strengthen their border on
    // hover in addition to Astryx's tint, so they read as targets.
    'clickable-card': {
      base: {
        transitionProperty: 'border-color, background-color',
        transitionDuration: 'var(--duration-fast)',
        ':hover': {borderColor: 'color-mix(in srgb, var(--color-text-secondary) 55%, transparent)'},
      },
    },
    // Roomier navigation: a 64px top bar with 16px gutters and wider top nav
    // items.
    'top-nav': {
      base: {paddingBlock: '14px', paddingInline: '16px'},
    },
    'top-nav-item': {
      base: {paddingInline: '16px'},
    },
    'side-nav': {
      base: {paddingInline: '12px'},
    },
    // Sidebar entries in the smaller supporting size so long titles fit. The
    // label inset matches the section headings' (spacing-2), so headings and
    // entries share one left edge.
    'side-nav-item': {
      base: {
        minHeight: '32px',
        paddingInline: 'var(--spacing-2)',
        fontSize: 'var(--text-supporting-size)',
        lineHeight: 'var(--text-supporting-leading)',
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
} satisfies DefineThemeInput;

export const jazzTheme = defineTheme(jazzThemeInput);
