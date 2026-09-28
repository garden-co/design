import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

// The kitchen sink renders the theme source (themes/jazz/jazzTheme.ts) at
// runtime, so settings changes apply without a theme build.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  server: {fs: {allow: ['..']}},
  build: {outDir: 'dist', emptyOutDir: true},
});
