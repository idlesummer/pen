import { defineConfig } from 'tsdown'

const tsdownConfig = defineConfig({
  // TypeScript config
  tsconfig: './tsconfig.json',

  // Entry points
  entry: {
    'index': 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
  },

  // Generation
  dts: true,
  sourcemap: true,

  // External dependencies
  external: [
    'commander',
    'rolldown',
    'chokidar',
    'react',
    'react-dom',
    'ink',
  ],
})

export default tsdownConfig
