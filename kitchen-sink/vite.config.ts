import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const principlesPath = fileURLToPath(new URL('../principles.mdx', import.meta.url));

/** Serves the principles source as plain text at /principles.mdx, for agents. */
function principlesSource(): Plugin {
  return {
    name: 'principles-source',
    configureServer(server) {
      server.middlewares.use('/principles.mdx', (_req, res) => {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.end(readFileSync(principlesPath));
      });
    },
    generateBundle() {
      this.emitFile({type: 'asset', fileName: 'principles.mdx', source: readFileSync(principlesPath)});
    },
  };
}

// The kitchen sink renders the theme source (themes/jazz/jazzTheme.ts) at
// runtime, so settings changes apply without a theme build.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [{enforce: 'pre', ...mdx({providerImportSource: undefined})}, react({include: /\.(mdx|tsx?)$/}), principlesSource()],
  server: {fs: {allow: ['..']}},
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // The kitchen sink, and the stipple generator on a page of its own.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        stipple: fileURLToPath(new URL('stipple/index.html', import.meta.url)),
      },
    },
  },
});
