/* eslint-disable no-var */
/// <reference types="vite/client" />

// Ambient declarations for globals installed by runtime.ts's installRefreshRuntime().
// Used by this runtime.ts and refresh-boundary.ts.txt during runtime

declare var $RefreshReg$:
| ((type: unknown, id: string) => void)
  | undefined

declare var $RefreshSig$:
  | (() => ReturnType<typeof import('react-refresh/runtime').createSignatureFunctionForTransform>)
  | undefined

declare var RefreshRuntime:
  | (typeof import('react-refresh/runtime') & {
      getRefreshReg: (filename: string) => (type: unknown, id: string) => void
      validateRefreshBoundaryAndEnqueueUpdate: (prevExports: Record<string, unknown>, nextExports: Record<string, unknown>) => string | undefined
    })
  | undefined
