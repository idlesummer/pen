import { defineConfig } from 'tsup'

const tsupConfig = defineConfig({
  // Entry points
  entry: {
    'cli/index': 'src/cli/index.ts',
    'build/index': 'src/core/build/index.ts',   // temporary
    'router/index': 'src/core/router/index.ts', // temporary
  },
  
  // Output format
  format: ['esm'],
  target: 'node24',
  
  // Bundling
  bundle: true,
  splitting: true,
  
  // Generation
  dts: true,
  sourcemap: true,
  clean: true,
  
  // External dependencies
  external: [
    'commander',
    'esbuild',
    'chokidar',
    'react',
    'react-dom',
    'ink',
  ],
  
  // Build options
  esbuildOptions: (options) => {
    options.alias = { ...options.alias, '@': './src' }
  },
})

export default tsupConfig
