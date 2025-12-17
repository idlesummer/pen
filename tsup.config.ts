import { defineConfig } from 'tsup'

const tsupConfig = defineConfig([
  // Runtime library (what users import)
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['react', 'ink'],
  },
  // CLI commands
  {
    entry: ['src/cli/index.ts'],
    format: ['esm'],
    outDir: 'dist/cli',
    clean: false,
    sourcemap: true,
    external: ['esbuild', 'chokidar'],
  },
])

export default tsupConfig
