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
| `fonts/`                  | Font files, each under its **own** licence (see below)    |

## Install

Not on npm yet. Install from git, pinned to a tag:

```sh
pnpm add github:garden-co/design#v0.1.0
```

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

`dist/` is committed on purpose: git dependencies are installed without
running build scripts.

## Licence

Code and theme sources are MIT (`LICENSE`). **Font files under `fonts/` are
excluded.** The Jazz faces in `fonts/jazz/` are proprietary and may be used
only on jazz.tools, garden.co and other Garden Computing products; nothing here
grants anyone else a licence to them. See [`fonts/README.md`](fonts/README.md).
Outside Garden Computing, drop `fonts.css` and the theme falls back to system
fonts.
