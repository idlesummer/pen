/** entry-app.tsx.txt is real TSX content stored with a .txt extension so
 *  rolldown's `with { type: 'text' }` import attribute takes effect - a real
 *  .tsx extension already has a built-in loader that claims the file before
 *  the attribute gets a say. */
declare module '*.txt' {
  const content: string
  export default content
}
