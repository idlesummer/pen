import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    isolate: false, // reuses workers between test files
  },
  resolve: {
    tsconfigPaths: true,  // resolves tsconfig's `@/*` paths
  },
})
