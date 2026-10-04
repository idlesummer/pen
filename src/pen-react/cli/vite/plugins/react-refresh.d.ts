// The three globals react-refresh-ink-plugin.ts installs in configureServer,
// read back out of transformed modules at runtime (via the generated header/
// footer strings, not by this file's own code - declared here so the plugin's
// own assignments to them type-check). This file has no import/export, so
// it's a global script already - declare global would be a no-op here.
// (react-refresh/runtime itself is typed by @types/react-refresh.)
// eslint-disable-next-line no-var -- declare requires var, not let/const
declare var $RefreshReg$: ((type: unknown, id: string) => void) | undefined
// eslint-disable-next-line no-var -- declare requires var, not let/const
declare var $RefreshSig$: (() => ReturnType<typeof import('react-refresh/runtime').createSignatureFunctionForTransform>) | undefined
// eslint-disable-next-line no-var -- declare requires var, not let/const
declare var RefreshRuntime: (typeof import('react-refresh/runtime') & {
  getRefreshReg: (filename: string) => (type: unknown, id: string) => void
  validateRefreshBoundaryAndEnqueueUpdate: (prevExports: Record<string, unknown>, nextExports: Record<string, unknown>) => string | undefined
}) | undefined
