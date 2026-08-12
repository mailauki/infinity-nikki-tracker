import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // Exclude the Next build output and deps; without this vitest walks .next
    // and tries to run compiled chunks as tests.
    exclude: ['node_modules/**', '.next/**'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, './') },
  },
  ssr: {
    // Vitest's jsdom environment still resolves node_modules through Vite's
    // "ssr" environment, which by default externalizes deps and hands real
    // .mjs files to Node's own loader. @mui/material/internal/Transition.mjs
    // does `import TransitionGroupContext from
    // 'react-transition-group/TransitionGroupContext'` — a subpath whose
    // package.json (main/module only, no "exports") is a shim Node's loader
    // won't follow, so it sees a directory import and throws
    // ERR_UNSUPPORTED_DIR_IMPORT. noExternal routes both packages through
    // Vite's own resolver/transform instead, which does follow the shim.
    // Works fine in `yarn dev`/`yarn build` (webpack/Turbopack); only vitest
    // needs this.
    noExternal: ['react-transition-group', '@mui/material'],
  },
})
