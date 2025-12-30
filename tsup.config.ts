import { defineConfig } from 'tsup'

const tsupConfig = defineConfig({
  entry: [
    'src/cli/index.ts', 

    // Temporary
    'src/build/index.ts',
    'src/router/index.ts',
  ],
  format: ['esm'],
  target: 'node24',
  bundle: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  dts: true,
  external: ['commander', 'esbuild', 'chokidar', 'react', 'react-dom'],
  esbuildOptions: (options) => {
    options.alias = { ...options.alias, '@': './src' }
  },
})

export default tsupConfig
