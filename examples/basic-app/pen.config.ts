import { defineConfig } from '@idlesummer/pen'

const penConfig = defineConfig({
  appDir: './src/app',
  outDir: './.pen',
  emitMetadata: true,
})

export default penConfig
