import { defineConfig } from 'tsup'

const tsupConfig = defineConfig({
  entry: {
    'index': 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
})

export default tsupConfig
