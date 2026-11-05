import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Resolves tsconfig's `@/*` paths natively - no plugin needed (Vite deprecated
  // vite-tsconfig-paths in favor of this as of resolve.tsconfigPaths).
  resolve: {
    tsconfigPaths: true,
  },
})
