/// <reference types="vite/client" />

// Ambient (no import/export of its own) so declare var takes effect without
// a declare global wrapper - see react-refresh-ink-plugin.ts's own notes on
// that. Lives here, next to the plugin, rather than under templates/ - these
// globals are the plugin's own runtime contract, not template-loading
// mechanics like templates.d.ts's *.tsx.txt/*.ts.txt wildcards.
//
// templates/refresh-boundary.ts.txt references this file by path directly,
// since the IDE opens it as an orphan file with no view of declarations made
// elsewhere in the project otherwise - a path reference resolves per-file
// regardless. Also carries vite/client's import.meta.hot types for the same
// reason.

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

// Not a real global - react-refresh-ink-plugin.ts replaces this token with a
// JSON.stringify'd string literal before the file ever runs. Declared only
// so the bare identifier in refresh-boundary.ts.txt type-checks as a string.
// eslint-disable-next-line no-var -- see above
declare var __PEN_REFRESH_FILENAME__: string
