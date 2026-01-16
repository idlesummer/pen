import { Context } from '@/core/build-tools'

export type BuildContext = Context & {
  appDir: string
  outDir: string
}
