/** Declares plain-text template imports to TypeScript. */
declare module '*.txt' {
  const content: string
  export default content
}
