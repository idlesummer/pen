/** Declares Rolldown's text imports to TypeScript. */
declare module '*.tsx.txt' {
  const content: string
  export default content
}

declare const __PEN_INK_OPTIONS__:
  import('ink').RenderOptions
