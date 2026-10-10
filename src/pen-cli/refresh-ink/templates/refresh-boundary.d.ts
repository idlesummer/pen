/// <reference types="vite/client" />

// Ambient declarations for globals installed by the React Refresh plugin.
// Referenced by refresh-boundary.ts.txt so the template is type-checked
// independently.

/** Globals installed by react-refresh-ink-plugin.ts's dev server, read by refresh-boundary.ts.txt at runtime. */
// eslint-disable-next-line no-var -- declare var, not declare global, is what makes this ambient file take effect
declare var $RefreshReg$: undefined |
  ((type: unknown, id: string) => void)

// eslint-disable-next-line no-var -- see above
declare var $RefreshSig$: undefined |
  (() => ReturnType<typeof import('react-refresh/runtime').createSignatureFunctionForTransform>)

// eslint-disable-next-line no-var -- see above
declare var RefreshRuntime: undefined | (typeof import('react-refresh/runtime') & {
  getRefreshReg: (filename: string) => (type: unknown, id: string) => void
  validateRefreshBoundaryAndEnqueueUpdate: (prevExports: Record<string, unknown>, nextExports: Record<string, unknown>) =>
    string | undefined
})
