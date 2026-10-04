/** Declares Rolldown's text imports to TypeScript. */
declare module '*.tsx.txt' {
  const content: string
  export default content
}

declare module '*.ts.txt' {
  const content: string
  export default content
}
