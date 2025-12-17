import { defineConfig } from 'tsup'

const tsupConfig = defineConfig({
  entry: ['src/cli/index.ts', 'src/runtime/index.ts'],
  format: ['esm'],
  target: 'node24',
  bundle: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  dts: true,
  external: ['commander', 'esbuild', 'chokidar'],
  esbuildOptions: (options) => {
    options.alias = {
      ...options.alias,
      '@': './src',
    }
  },
})

export default tsupConfig
