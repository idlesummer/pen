/// <reference types="vite/client" />

// Ambient declarations for the React Refresh globals installRefreshRuntime()
// installs. runtime.ts gets these for free as a real .ts file; the
// refresh-boundary.ts.txt template needs the explicit reference below since
// it's a .txt file invisible to the compiler otherwise.

/** Installed by runtime.ts's installRefreshRuntime(), read here and by refresh-boundary.ts.txt at runtime. */
// eslint-disable-next-line no-var -- declare var, not declare global, is what makes this ambient file take effect
declare var $RefreshReg$:
| ((type: unknown, id: string) => void)
  | undefined

// eslint-disable-next-line no-var -- see above
declare var $RefreshSig$:
  | (() => ReturnType<typeof import('react-refresh/runtime').createSignatureFunctionForTransform>)
  | undefined

// eslint-disable-next-line no-var -- see above
declare var RefreshRuntime:
  | (typeof import('react-refresh/runtime') & {
      getRefreshReg: (filename: string) => (type: unknown, id: string) => void
      validateRefreshBoundaryAndEnqueueUpdate: (prevExports: Record<string, unknown>, nextExports: Record<string, unknown>) => string | undefined
    })
  | undefined
