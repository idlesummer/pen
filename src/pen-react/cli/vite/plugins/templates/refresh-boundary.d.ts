/// <reference types="vite/client" />

// Ambient (no import/export of its own) so declare var takes effect without
// a declare global wrapper - see react-refresh-ink-plugin.ts's own notes on
// that. Needed in its own file, rather than inside react-refresh-ink-plugin.ts,
// because refresh-boundary.ts.txt is opened by the IDE as an orphan file with
// no view of that file's declarations - only a real ambient .d.ts anywhere in
// the project reaches it. Also carries vite/client's import.meta.hot types for
// the same reason (the .txt file's own reference directive doesn't reach them
// in that orphan context).

/** Globals installed by react-refresh-ink-plugin.ts's dev server, read by refresh-boundary.ts.txt at runtime. */
// eslint-disable-next-line no-var -- declare var, not declare global, is what makes this ambient file take effect
declare var $RefreshReg$: undefined |
  ((type: unknown, id: string) => void)

// eslint-disable-next-line no-var -- see above
declare var $RefreshSig$: undefined |
  (() => ReturnType<typeof import('react-refresh/runtime').createSignatureFunctionForTransform>)

// eslint-disable-next-line no-var -- see above
declare var RefreshRuntime: undefined |
  (typeof import('react-refresh/runtime') & {
    getRefreshReg: (filename: string) => (type: unknown, id: string) => void
    validateRefreshBoundaryAndEnqueueUpdate: (prevExports: Record<string, unknown>, nextExports: Record<string, unknown>) =>
      string | undefined
  })
