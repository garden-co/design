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

  // Half of Astryx's default rounding (Anselm, 2026-09-28).
  radius: {base: 2, multiplier: 1.5},

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
    // Dark cards sit one step above the surface (not below it), so a card
    // reads as a raised object rather than a hole in the page.
    '--color-background-card': ['#FFFFFF', '#171717'],
    '--color-background-popover': ['#FFFFFF', '#0A0A0A'],
    '--color-text-primary': ['#0A0A0A', '#EBEBEB'],
    // #737373 (the site's muted grey) is 4.35:1 on #F5F5F5; #6B6B6B passes AA.
    // #939393 is the site's dark muted grey (70% at 0.8 alpha) flattened.
    '--color-text-secondary': ['#6B6B6B', '#939393'],
    // Dark borders at 12% white stay visible on both #0A0A0A and #171717.
    '--color-border': ['#CCCCCC80', '#FFFFFF1F'],
    '--focus-outline-color': 'var(--color-accent)',
  },

  components: {
    heading: {
      // Document headings (docs, dashboard) keep Astryx's level sizes with
      // the brand face and slightly tight tracking. The homepage's oversized
      // section headings set their size, weight and leading at the call site.
      base: {letterSpacing: '-0.02em', textWrap: 'balance'},
      // Document scale (docs page titles and sections), close to Tailwind's
      // 4xl / 2xl / xl steps; the 1.125 type ratio alone makes them too small.
      'level:1': {fontSize: '2.25rem', lineHeight: '2.5rem'},
      'level:2': {fontSize: '1.5rem', lineHeight: '2rem'},
      'level:3': {fontSize: '1.25rem', lineHeight: '1.75rem'},
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
