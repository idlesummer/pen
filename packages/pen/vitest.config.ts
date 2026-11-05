import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,  // resolves tsconfig's `@/*` paths
  },
})
