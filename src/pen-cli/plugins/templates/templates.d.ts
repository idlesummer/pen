/** Declares Rolldown's text imports to TypeScript. */
declare module '*.tsx.txt' {
  const content: string
  export default content
}

import type { RenderOptions } from 'ink'
declare const __PEN_INK_OPTIONS__: RenderOptions
