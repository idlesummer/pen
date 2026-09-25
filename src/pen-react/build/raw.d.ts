/** Ambient type for entry-app.tsx?raw - the real shape (its exports as a
 *  component/script) doesn't apply here, since tsdown's own raw-import
 *  plugin (see tsdown.config.ts) rewrites this specifier to a plain string
 *  at pen's own build time. */
declare module '*.tsx?raw' {
  const content: string
  export default content
}
