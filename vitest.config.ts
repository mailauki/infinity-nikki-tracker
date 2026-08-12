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
})
