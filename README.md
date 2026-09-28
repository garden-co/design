# garden-co design

Shared design system for garden-co projects, built on
[Astryx](https://astryx.atmeta.com). The first theme is **Jazz**, extracted
from the jazz.tools homepage.

## What's here

| Path                      | What                                                      |
| ------------------------- | --------------------------------------------------------- |
| `themes/jazz/jazzTheme.ts`| Theme source (`defineTheme`)                              |
| `dist/jazz/jazz.{js,css}` | Built Astryx theme for React apps (`<Theme theme={…}>`)  |
| `dist/jazz/tokens.css`    | Every token resolved on `:root`, for non-React code       |
| `themes/jazz/fonts.css`   | `@font-face` rules for the families the theme names       |
| `react/`                  | Small React helpers for theme-only variants (`Eyebrow`)   |
| `fonts/`                  | Font files, each under its **own** licence (see below)    |

## Install

Not on npm and not tagged yet. Install from git, pinned to a full commit hash on `main`:

```sh
pnpm add github:garden-co/design#<commit-sha>
```

Bump the pin when a consumer needs a newer theme. Tagged releases and npm publishing come later, once the system settles.

## Use

**React with Astryx components**

```tsx
import {Theme} from '@astryxdesign/core';
import {jazzTheme} from '@garden-co/design/jazz';
import '@astryxdesign/core/reset.css';
import '@garden-co/design/jazz/theme.css';
import '@garden-co/design/jazz/fonts.css';

<Theme theme={jazzTheme} mode="system">…</Theme>
```

**Anything else (Vue, Svelte, plain CSS)**

```css
@import "@garden-co/design/jazz/tokens.css";
@import "@garden-co/design/jazz/fonts.css";

.button { background: var(--color-accent); color: var(--color-on-accent); }
```

With Tailwind v4, add `@astryxdesign/core/tailwind-theme.css` after the tokens
to get utilities such as `bg-surface` and `text-primary`.

## Develop

```sh
pnpm install
pnpm build   # rebuild dist/ after editing a theme, then commit it
pnpm check   # what CI runs: fails when dist/ is stale
```

### Kitchen sink

```sh
pnpm install
pnpm sink    # http://localhost:5173
```

`kitchen-sink/` is a local app that renders every Astryx component in the Jazz
theme, three ways: a component overview, a docs page and a dashboard screen
assembled the way the real products assemble them. A settings panel re-themes
everything live (mode, accent, greys, contrast, type scale and faces, radius,
pinned colours, component overrides as JSON). Changes stay in your browser;
**Copy changes** puts a JSON diff against `jazzTheme.ts` on the clipboard to
paste back into the theme. `vercel.json` deploys it as a static site
(served with `noindex`); keep it on its vercel.app domain.

`dist/` is committed on purpose: git dependencies are installed without
running build scripts.

## Licence

Code and theme sources are MIT (`LICENSE`). **Font files under `fonts/` are
excluded.** The Jazz faces in `fonts/jazz/` are proprietary and may be used
only on jazz.tools, garden.co and other Garden Computing products; nothing here
grants anyone else a licence to them. See [`fonts/README.md`](fonts/README.md).
Outside Garden Computing, drop `fonts.css` and the theme falls back to system
fonts.
