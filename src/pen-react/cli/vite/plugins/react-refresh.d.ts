/** react-refresh ships no types of its own - this declares only the
 *  runtime exports this plugin actually uses. */
declare module 'react-refresh/runtime' {
  export function injectIntoGlobalHook(globalObject: typeof globalThis): void
  export function register(type: unknown, id: string): void
  export function isLikelyComponentType(type: unknown): boolean
  export function performReactRefresh(): void
  export function createSignatureFunctionForTransform(): <T>(type: T, key: string, forceReset?: boolean, getCustomHooks?: () => unknown[]) => T
}

// The three globals react-refresh-ink-plugin.ts installs in configureServer,
// read back out of transformed modules at runtime (via the generated header/
// footer strings, not by this file's own code - declared here so the plugin's
// own assignments to them type-check). This file has no import/export, so
// it's a global script already - declare global would be a no-op here.
// eslint-disable-next-line no-var -- declare requires var, not let/const
declare var $RefreshReg$: ((type: unknown, id: string) => void) | undefined
// eslint-disable-next-line no-var -- declare requires var, not let/const
declare var $RefreshSig$: (() => <T>(type: T, key: string, forceReset?: boolean, getCustomHooks?: () => unknown[]) => T) | undefined
// eslint-disable-next-line no-var -- declare requires var, not let/const
declare var RefreshRuntime: (typeof import('react-refresh/runtime') & {
  getRefreshReg: (filename: string) => (type: unknown, id: string) => void
  validateRefreshBoundaryAndEnqueueUpdate: (prevExports: Record<string, unknown>, nextExports: Record<string, unknown>) => string | undefined
}) | undefined
